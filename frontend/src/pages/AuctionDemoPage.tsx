import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ApiTraceDrawer, type ApiTrace } from "../components/demo/ApiTraceDrawer";
import { Button } from "../components/ui/Button";
import { Section } from "../components/ui/Section";
import {
  createProduct,
  fetchProducts,
  placeBid,
  type CreateProductPayload,
  type Product,
} from "../lib/api";
import { useDemoSession } from "../hooks/useDemoSession";

type InlineNotice = {
  tone: "success" | "error" | "info";
  title: string;
  message: string;
} | null;

const initialProduct: CreateProductPayload = {
  title: "",
  description: "",
  starting_bid: "",
  image_url: "",
  location: "",
};

const inputClasses =
  "w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-zinc-950 shadow-sm outline-none transition-all duration-300 ease-soft placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-4 focus:ring-zinc-950/5";

function NoticeCard({ notice }: { notice: InlineNotice }) {
  if (!notice) {
    return null;
  }

  return (
    <div
      className={[
        "rounded-[1.5rem] border px-5 py-4 shadow-sm",
        notice.tone === "error"
          ? "border-red-100 bg-red-50"
          : notice.tone === "success"
            ? "border-emerald-100 bg-emerald-50"
            : "border-blue-100 bg-blue-50",
      ].join(" ")}
    >
      <p
        className={[
          "text-xs font-semibold uppercase tracking-[0.24em]",
          notice.tone === "error" ? "text-red-500" : notice.tone === "success" ? "text-emerald-600" : "text-blue-600",
        ].join(" ")}
      >
        {notice.title}
      </p>
      <p className="mt-2 text-sm leading-7 text-zinc-700">{notice.message}</p>
    </div>
  );
}

function formatError(data: unknown, fallback: string) {
  if (typeof data === "object" && data !== null) {
    const detailValue = (data as Record<string, unknown>).detail;
    if (typeof detailValue === "string") {
      return detailValue;
    }
  }

  return fallback;
}

export function AuctionDemoPage() {
  const hasLoadedInitialProducts = useRef(false);
  const { tokenState, idTokenClaims, isAuthenticated } = useDemoSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [hiddenImages, setHiddenImages] = useState<Record<number, boolean>>({});
  const [productForm, setProductForm] = useState(initialProduct);
  const [bidAmount, setBidAmount] = useState("");
  const [traces, setTraces] = useState<ApiTrace[]>([]);
  const [selectedTraceId, setSelectedTraceId] = useState<number | null>(null);
  const [isTracePanelOpen, setIsTracePanelOpen] = useState(false);
  const [productNotice, setProductNotice] = useState<InlineNotice>(null);
  const [bidNotice, setBidNotice] = useState<InlineNotice>(null);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [isBidding, setIsBidding] = useState(false);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedId) ?? products[0] ?? null,
    [products, selectedId],
  );
  const selectedTrace = useMemo(
    () => traces.find((trace) => trace.id === selectedTraceId) ?? null,
    [traces, selectedTraceId],
  );
  const shouldShowImage = Boolean(selectedProduct?.image_url && !hiddenImages[selectedProduct.id]);
  const signInMethod = idTokenClaims ? "OIDC Google" : isAuthenticated ? "Username/password" : "Guest";

  useEffect(() => {
    if (hasLoadedInitialProducts.current) {
      return;
    }

    hasLoadedInitialProducts.current = true;
    void loadProducts();
  }, []);

  useEffect(() => {
    if (!selectedId && products[0]) {
      setSelectedId(products[0].id);
    }
  }, [products, selectedId]);

  function pushTrace(entry: Omit<ApiTrace, "id">) {
    const nextTrace = { id: Date.now() + Math.random(), ...entry };
    setTraces((current) => [nextTrace, ...current].slice(0, 12));
  }

  function applyError(
    caught: unknown,
    fallback: string,
    title: string,
    setNotice: (notice: InlineNotice) => void,
    category: ApiTrace["category"],
  ) {
    const apiError = caught as {
      status?: number;
      data?: unknown;
      log?: { method: string; url: string; body?: unknown };
    };

    setNotice({
      tone: "error",
      title,
      message: formatError(apiError?.data, fallback),
    });

    if (apiError.log) {
      pushTrace({
        title,
        method: apiError.log.method,
        url: apiError.log.url,
        payload: apiError.log.body,
        response: apiError.data,
        status: apiError.status,
        category,
      });
    }
  }

  async function loadProducts() {
    try {
      const result = await fetchProducts();
      setProducts(result.data);
      pushTrace({
        title: "Fetched product list",
        method: result.log.method,
        url: result.log.url,
        payload: result.log.body,
        response: result.data,
        status: result.status,
        category: "product",
        summary: "Public product data loaded for the auction app.",
      });
    } catch (caught) {
      const apiError = caught as {
        status?: number;
        data?: unknown;
        log?: { method: string; url: string; body?: unknown };
      };

      if (apiError.log) {
        pushTrace({
          title: "Product fetch failed",
          method: apiError.log.method,
          url: apiError.log.url,
          payload: apiError.log.body,
          response: apiError.data,
          status: apiError.status,
          category: "product",
        });
      }
    }
  }

  async function handleCreateProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!tokenState?.access) {
      setProductNotice({
        tone: "info",
        title: "Authentication required",
        message: "Open Auth Showcase and sign in before creating a product.",
      });
      return;
    }

    setIsCreatingProduct(true);
    setProductNotice(null);

    try {
      const result = await createProduct(productForm, tokenState.access);
      setProductNotice({
        tone: "success",
        title: "Product created",
        message: `${result.data.title} is now available in the auction list.`,
      });
      pushTrace({
        title: "Product creation",
        method: result.log.method,
        url: result.log.url,
        payload: result.log.body,
        response: result.data,
        status: result.status,
        category: "product",
        summary: "Authenticated product creation used the shared backend JWT.",
      });
      setProductForm(initialProduct);
      await loadProducts();
      setSelectedId(result.data.id);
    } catch (caught) {
      applyError(caught, "Product creation failed.", "Product creation failed", setProductNotice, "product");
    } finally {
      setIsCreatingProduct(false);
    }
  }

  async function handleBid(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProduct || !tokenState?.access) {
      setBidNotice({
        tone: "info",
        title: "Authentication required",
        message: "Sign in first to place a bid.",
      });
      return;
    }

    setIsBidding(true);
    setBidNotice(null);

    try {
      const result = await placeBid(selectedProduct.id, bidAmount, tokenState.access);
      setBidNotice({
        tone: "success",
        title: "Bid accepted",
        message: `The API accepted a bid of ${result.data.bid_amount}.`,
      });
      pushTrace({
        title: "Bid submission",
        method: result.log.method,
        url: result.log.url,
        payload: result.log.body,
        response: result.data,
        status: result.status,
        category: "bid",
        summary: "Authenticated bid submission used the shared backend JWT.",
      });
      setBidAmount("");
      await loadProducts();
    } catch (caught) {
      applyError(caught, "Bid failed.", "Bid submission failed", setBidNotice, "bid");
    } finally {
      setIsBidding(false);
    }
  }

  return (
    <>
      <ApiTraceDrawer
        title="Auction API activity"
        description="Inspect request/response payloads"
        traces={traces}
        selectedTrace={selectedTrace}
        isOpen={isTracePanelOpen}
        onToggle={() => setIsTracePanelOpen((current) => !current)}
        onSelectTrace={setSelectedTraceId}
        onRefresh={() => void loadProducts()}
      />

      <Section className="pt-16 sm:pt-20 bg-zinc-50/70">
        <div className="mx-auto space-y-10">
          <div className="flex flex-col justify-between gap-6 rounded-[2rem] border border-zinc-200/70 bg-white p-8 shadow-soft sm:p-10 lg:flex-row lg:items-end">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.34em] text-blue-600">Auction App</p>
              <h1 className="mt-6 text-5xl font-semibold tracking-[-0.05em] text-zinc-950 sm:text-6xl">
                A small marketplace backed by JWT auth.
              </h1>
              <p className="mt-6 text-lg leading-8 text-zinc-600">
                Browse listings, create products, and place bids through the same authenticated session established in the Auth Showcase.
              </p>
            </div>

            <div className="w-full rounded-[1.5rem] border border-zinc-200/70 bg-zinc-50 p-5 shadow-sm lg:max-w-xs">
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-400">Session</p>
              <p className="mt-2 text-lg font-semibold text-zinc-950">
                {isAuthenticated ? "Authenticated" : "Guest mode"}
              </p>
              {isAuthenticated ? (
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-zinc-500">Username</dt>
                    <dd className="min-w-0 break-words text-right font-medium text-zinc-900">
                      {tokenState?.user.username || "Not provided"}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-zinc-500">Method</dt>
                    <dd className="text-right font-medium text-zinc-900">{signInMethod}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-zinc-500">Email</dt>
                    <dd className="min-w-0 break-words text-right font-medium text-zinc-900">
                      {tokenState?.user.email || "Not provided"}
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="mt-2 truncate text-sm text-zinc-500">Sign in to create products or bid.</p>
              )}
              {!isAuthenticated ? (
                <Link
                  to="/demo/auth"
                  className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-zinc-950 px-6 py-3 text-sm font-medium text-white shadow-sm transition-all duration-300 ease-soft hover:-translate-y-0.5 hover:bg-zinc-800 hover:shadow-md"
                >
                  Open Auth Showcase
                </Link>
              ) : null}
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr]">
            <div className="space-y-8">
              <div className="rounded-[2rem] border border-zinc-200/70 bg-white p-7 shadow-soft sm:p-8">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-zinc-500">Products</p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-zinc-950">
                      Active listings
                    </h2>
                  </div>
                  <span className="rounded-full bg-zinc-100 px-4 py-2 text-xs uppercase tracking-[0.24em] text-zinc-500">
                    {products.length}
                  </span>
                </div>

                <div className="mt-6 space-y-3">
                  {products.map((product) => {
                    const isSelected = product.id === selectedProduct?.id;
                    return (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => setSelectedId(product.id)}
                        className={[
                          "w-full rounded-[1.5rem] border px-5 py-4 text-left transition-all duration-300 ease-soft",
                          isSelected
                            ? "border-zinc-950 bg-zinc-950 text-white shadow-md"
                            : "border-zinc-200 bg-zinc-50 text-zinc-800 hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-white hover:shadow-sm",
                        ].join(" ")}
                      >
                        <p className="text-sm font-semibold">{product.title}</p>
                        <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                          <span className={isSelected ? "text-zinc-300" : "text-zinc-500"}>{product.location}</span>
                          <span className={isSelected ? "text-white" : "text-zinc-950"}>
                            {product.current_highest_bid}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                  {!products.length ? (
                    <div className="rounded-[1.25rem] bg-zinc-50 px-5 py-5">
                      <p className="text-sm leading-relaxed text-zinc-500">No products returned from the API yet.</p>
                    </div>
                  ) : null}
                </div>
              </div>

              {isAuthenticated ? (
                <div className="rounded-[2rem] border border-zinc-200/70 bg-white p-7 shadow-soft sm:p-8">
                  <p className="text-sm font-medium text-zinc-500">Create product</p>
                  <form className="mt-6 space-y-4" onSubmit={handleCreateProduct}>
                    <input
                      aria-label="Title"
                      placeholder="Title"
                      className={inputClasses}
                      value={productForm.title}
                      onChange={(event) =>
                        setProductForm((current) => ({ ...current, title: event.target.value }))
                      }
                    />
                    <textarea
                      aria-label="Description"
                      placeholder="Description"
                      className={`${inputClasses} min-h-[120px]`}
                      value={productForm.description}
                      onChange={(event) =>
                        setProductForm((current) => ({ ...current, description: event.target.value }))
                      }
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <input
                        aria-label="Starting bid"
                        inputMode="decimal"
                        placeholder="Starting bid"
                        className={inputClasses}
                        value={productForm.starting_bid}
                        onChange={(event) =>
                          setProductForm((current) => ({ ...current, starting_bid: event.target.value }))
                        }
                      />
                      <input
                        aria-label="Location"
                        placeholder="Location"
                        className={inputClasses}
                        value={productForm.location}
                        onChange={(event) =>
                          setProductForm((current) => ({ ...current, location: event.target.value }))
                        }
                      />
                    </div>
                    <input
                      aria-label="Image URL"
                      placeholder="Image URL"
                      className={inputClasses}
                      value={productForm.image_url}
                      onChange={(event) =>
                        setProductForm((current) => ({ ...current, image_url: event.target.value }))
                      }
                    />
                    <Button className="w-full shadow-sm hover:-translate-y-0.5 hover:bg-zinc-800 hover:shadow-md disabled:translate-y-0 disabled:opacity-60" type="submit" disabled={isCreatingProduct}>
                      {isCreatingProduct ? "Processing" : "Create Product"}
                    </Button>
                    <NoticeCard notice={productNotice} />
                  </form>
                </div>
              ) : null}
            </div>

            <div className="rounded-[2rem] border border-zinc-200/70 bg-white p-7 shadow-soft sm:p-8">
              <p className="text-sm font-medium text-zinc-500">Selected listing</p>
              {selectedProduct ? (
                <div className="mt-6 space-y-8">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-2xl">
                      <h2 className="text-4xl font-semibold tracking-[-0.04em] text-zinc-950">
                        {selectedProduct.title}
                      </h2>
                      <p className="mt-4 text-base leading-8 text-zinc-600">{selectedProduct.description}</p>
                    </div>
                    <div className="rounded-[1.5rem] bg-zinc-950 px-6 py-5 text-white shadow-md">
                      <p className="text-xs uppercase tracking-[0.24em] text-zinc-400">Highest bid</p>
                      <p className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
                        {selectedProduct.current_highest_bid}
                      </p>
                    </div>
                  </div>

                  {shouldShowImage ? (
                    <div className="overflow-hidden rounded-[1.75rem] border border-zinc-200/70 bg-zinc-50 shadow-sm">
                      <img
                        src={selectedProduct.image_url}
                        alt={selectedProduct.title}
                        className="h-[22rem] w-full object-cover"
                        onError={() =>
                          setHiddenImages((current) => ({
                            ...current,
                            [selectedProduct.id]: true,
                          }))
                        }
                      />
                    </div>
                  ) : null}

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-[1.5rem] border border-zinc-200/70 bg-zinc-50 p-5">
                      <p className="text-xs uppercase tracking-[0.24em] text-zinc-400">Location</p>
                      <p className="mt-3 text-lg font-medium text-zinc-900">{selectedProduct.location}</p>
                    </div>
                    <div className="rounded-[1.5rem] border border-zinc-200/70 bg-zinc-50 p-5">
                      <p className="text-xs uppercase tracking-[0.24em] text-zinc-400">Starting bid</p>
                      <p className="mt-3 text-lg font-medium text-zinc-900">{selectedProduct.starting_bid}</p>
                    </div>
                    <div className="rounded-[1.5rem] border border-zinc-200/70 bg-zinc-50 p-5">
                      <p className="text-xs uppercase tracking-[0.24em] text-zinc-400">Seller</p>
                      <p className="mt-3 text-lg font-medium text-zinc-900">#{selectedProduct.seller}</p>
                    </div>
                  </div>

                  {!isAuthenticated ? (
                    <div className="rounded-[1.5rem] border border-blue-100 bg-blue-50 px-5 py-4">
                      <p className="text-sm leading-7 text-zinc-600">
                        Sign in from the Auth Showcase to place bids and create products with the backend JWT session.
                      </p>
                    </div>
                  ) : (
                    <form
                      className="rounded-[1.75rem] border border-zinc-200/70 bg-zinc-50 p-5 shadow-sm"
                      onSubmit={handleBid}
                    >
                      <div className="flex flex-col gap-4 sm:flex-row">
                        <input
                          aria-label="Bid amount"
                          inputMode="decimal"
                          placeholder="200.00"
                          className={`${inputClasses} min-w-0 flex-1`}
                          value={bidAmount}
                          onChange={(event) => setBidAmount(event.target.value)}
                        />
                        <Button className="shadow-sm hover:-translate-y-0.5 hover:bg-zinc-800 hover:shadow-md disabled:translate-y-0 disabled:opacity-60" type="submit" disabled={isBidding}>
                          {isBidding ? "Processing" : "Place Bid"}
                        </Button>
                      </div>
                      <NoticeCard notice={bidNotice} />
                    </form>
                  )}
                </div>
              ) : (
                <p className="mt-6 text-zinc-500">No products returned from the API yet.</p>
              )}
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
