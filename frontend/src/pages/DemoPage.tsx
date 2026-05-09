import { FormEvent, useEffect, useMemo, useState } from "react";
import { Button } from "../components/ui/Button";
import { Section } from "../components/ui/Section";
import {
  createProduct,
  fetchProducts,
  login,
  placeBid,
  register,
  type CreateProductPayload,
  type Product,
  type RegisterResponse,
  type TokenResponse,
} from "../lib/api";

type ApiTrace = {
  id: number;
  title: string;
  method: string;
  url: string;
  payload?: unknown;
  response?: unknown;
  status?: number;
};

type InlineNotice = {
  tone: "success" | "error" | "info";
  title: string;
  message: string;
} | null;

const initialCredentials = {
  username: "testuser",
  password: "testpass123",
};

const initialRegistration = {
  username: "",
  email: "",
  password: "",
};

const initialProduct: CreateProductPayload = {
  title: "",
  description: "",
  starting_bid: "",
  image_url: "",
  location: "",
};

function NoticeCard({ notice }: { notice: InlineNotice }) {
  if (!notice) {
    return null;
  }

  return (
    <div
      className={[
        "rounded-[1.5rem] border px-5 py-4",
        notice.tone === "error"
          ? "border-zinc-300 bg-zinc-50"
          : "border-zinc-200/80 bg-zinc-50/80",
      ].join(" ")}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-400">{notice.title}</p>
      <p className="mt-2 text-sm leading-7 text-zinc-700">{notice.message}</p>
    </div>
  );
}

export function DemoPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [hiddenImages, setHiddenImages] = useState<Record<number, boolean>>({});
  const [tokenState, setTokenState] = useState<TokenResponse | null>(null);
  const [credentials, setCredentials] = useState(initialCredentials);
  const [registration, setRegistration] = useState(initialRegistration);
  const [productForm, setProductForm] = useState(initialProduct);
  const [bidAmount, setBidAmount] = useState("");
  const [traces, setTraces] = useState<ApiTrace[]>([]);
  const [selectedTraceId, setSelectedTraceId] = useState<number | null>(null);
  const [isTracePanelOpen, setIsTracePanelOpen] = useState(false);
  const [authNotice, setAuthNotice] = useState<InlineNotice>(null);
  const [productNotice, setProductNotice] = useState<InlineNotice>(null);
  const [bidNotice, setBidNotice] = useState<InlineNotice>(null);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [isBidding, setIsBidding] = useState(false);

  const isAuthenticated = Boolean(tokenState?.access);
  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedId) ?? products[0] ?? null,
    [products, selectedId],
  );
  const selectedTrace = useMemo(
    () => traces.find((trace) => trace.id === selectedTraceId) ?? null,
    [traces, selectedTraceId],
  );
  const shouldShowImage = Boolean(
    selectedProduct?.image_url && !hiddenImages[selectedProduct.id],
  );

  function methodBadgeClasses(method: string) {
    return method === "GET"
      ? "bg-zinc-100 text-zinc-700"
      : "bg-zinc-900 text-white";
  }

  function statusBadgeClasses(status?: number) {
    if (!status) {
      return "bg-zinc-100 text-zinc-500";
    }

    if (status >= 200 && status < 300) {
      return "bg-emerald-50 text-emerald-700";
    }

    return "bg-red-50 text-red-700";
  }

  useEffect(() => {
    void loadProducts();
  }, []);

  useEffect(() => {
    if (!selectedId && products[0]) {
      setSelectedId(products[0].id);
    }
  }, [products, selectedId]);

  function pushTrace(entry: Omit<ApiTrace, "id">) {
    const nextTrace = { id: Date.now(), ...entry };
    setTraces((current) => [nextTrace, ...current].slice(0, 8));
  }

  function formatError(data: unknown, fallback: string) {
    if (typeof data === "object" && data !== null) {
      const detailValue = (data as Record<string, unknown>).detail;
      if (typeof detailValue === "string") {
        return detailValue;
      }
      return JSON.stringify(data);
    }
    return fallback;
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
        });
      }
    }
  }

  function applyError(
    caught: unknown,
    fallback: string,
    title: string,
    setNotice: (notice: InlineNotice) => void,
  ) {
    const apiError = caught as {
      status?: number;
      data?: unknown;
      log?: { method: string; url: string; body?: unknown };
    };
    const message = formatError(apiError?.data, fallback);

    setNotice({
      tone: "error",
      title,
      message,
    });

    if (apiError.log) {
      pushTrace({
        title,
        method: apiError.log.method,
        url: apiError.log.url,
        payload: apiError.log.body,
        response: apiError.data,
        status: apiError.status,
      });
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsAuthLoading(true);
    setAuthNotice(null);

    try {
      const result = await login(credentials.username, credentials.password);
      setTokenState(result.data);
      setAuthNotice({
        tone: "success",
        title: "Signed in",
        message: `Signed in as ${result.data.user.username}.`,
      });
      pushTrace({
        title: "JWT login",
        method: result.log.method,
        url: result.log.url,
        payload: result.log.body,
        response: result.data,
        status: result.status,
      });
      setIsRegisterMode(false);
    } catch (caught) {
      applyError(caught, "Login failed.", "JWT login failed", setAuthNotice);
    } finally {
      setIsAuthLoading(false);
    }
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsRegistering(true);
    setAuthNotice(null);

    try {
      const result = await register(registration.username, registration.email, registration.password);
      const registeredUser = result.data as RegisterResponse;
      setAuthNotice({
        tone: "success",
        title: "Registered",
        message: `Created account for ${registeredUser.username}. You can sign in now.`,
      });
      pushTrace({
        title: "User registration",
        method: result.log.method,
        url: result.log.url,
        payload: result.log.body,
        response: result.data,
        status: result.status,
      });
      setRegistration(initialRegistration);
      setCredentials({
        username: registeredUser.username,
        password: "",
      });
      setIsRegisterMode(false);
    } catch (caught) {
      applyError(caught, "Registration failed.", "User registration failed", setAuthNotice);
    } finally {
      setIsRegistering(false);
    }
  }

  async function handleCreateProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!tokenState?.access) {
      setProductNotice({
        tone: "info",
        title: "Authentication required",
        message: "Sign in before creating a product.",
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
      });
      setProductForm(initialProduct);
      await loadProducts();
      setSelectedId(result.data.id);
    } catch (caught) {
      applyError(caught, "Product creation failed.", "Product creation failed", setProductNotice);
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
      });
      setBidAmount("");
      await loadProducts();
    } catch (caught) {
      applyError(caught, "Bid failed.", "Bid submission failed", setBidNotice);
    } finally {
      setIsBidding(false);
    }
  }

  function handleSignOut() {
    setTokenState(null);
    setAuthNotice({
      tone: "info",
      title: "Signed out",
      message: "The session has been cleared from the demo UI.",
    });
    setProductNotice(null);
    setBidNotice(null);
  }

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-0 z-40 h-0">
        <div className="pointer-events-auto absolute right-6 top-6">
          <button
            type="button"
            onClick={() => setIsTracePanelOpen((current) => !current)}
            className="rounded-full border border-zinc-200 bg-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500 transition-all duration-300 ease-in-out hover:bg-zinc-50"
            aria-expanded={isTracePanelOpen}
            aria-controls="api-trace-panel"
          >
            {isTracePanelOpen ? "Close API" : "Open API"}
          </button>
        </div>
      </div>

      {isTracePanelOpen ? (
        <aside
          id="api-trace-panel"
          className="fixed right-3 top-3 z-30 h-[calc(100%-1.5rem)] w-[min(48rem,calc(100vw-1.5rem))] rounded-2xl border border-zinc-200 bg-white px-6 py-7 transition-transform duration-300 ease-in-out"
        >
          <div className="flex h-full flex-col">
            <div className="flex items-start justify-between gap-4 pb-5">
              <div>
                <p className="text-sm font-medium text-zinc-500">API responses</p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                  Expand this panel when you want to inspect backend request and response details.
                </p>
              </div>
              <div className="w-16" />
            </div>

            {!selectedTrace ? (
              <>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.24em] text-zinc-400">Recent activity</p>
                  <button
                    type="button"
                    onClick={() => void loadProducts()}
                    className="text-sm text-zinc-500 transition-opacity duration-300 ease-in-out hover:opacity-60"
                  >
                    Refresh data
                  </button>
                </div>

                <div className="mt-5 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
                  {traces.map((trace) => (
                    <button
                      key={trace.id}
                      type="button"
                      onClick={() => setSelectedTraceId(trace.id)}
                      className="w-full rounded-[1.25rem] border border-zinc-200 bg-zinc-50 px-4 py-4 text-left text-zinc-900 transition-all duration-300 ease-in-out hover:bg-zinc-100"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={[
                                "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
                                methodBadgeClasses(trace.method),
                              ].join(" ")}
                            >
                              {trace.method}
                            </span>
                            <span className="text-[11px] uppercase tracking-[0.24em] text-zinc-400">
                              {trace.title}
                            </span>
                          </div>
                          <p className="mt-3 truncate text-sm font-medium">{trace.url}</p>
                        </div>
                        <div
                          className={[
                            "inline-flex rounded-full px-3 py-1 text-xs font-medium",
                            statusBadgeClasses(trace.status),
                          ].join(" ")}
                        >
                          {trace.status ?? "pending"}
                        </div>
                      </div>
                    </button>
                  ))}
                  {!traces.length ? (
                    <div className="rounded-[1.25rem] bg-zinc-50 px-5 py-5">
                      <p className="text-sm leading-relaxed text-zinc-500">API activity will appear here.</p>
                    </div>
                  ) : null}
                </div>
              </>
            ) : (
              <>
                <div className="mt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setSelectedTraceId(null)}
                    className="text-sm text-zinc-500 transition-opacity duration-300 ease-in-out hover:opacity-60"
                  >
                    Back to list
                  </button>
                  <div
                    className={[
                      "inline-flex rounded-full px-3 py-1 text-xs font-medium",
                      statusBadgeClasses(selectedTrace.status),
                    ].join(" ")}
                  >
                    {selectedTrace.status ?? "pending"}
                  </div>
                </div>

                <div className="mt-5 min-h-0 flex-1 overflow-y-auto pr-1">
                  <div className="rounded-xl bg-zinc-50 px-5 py-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={[
                              "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
                              methodBadgeClasses(selectedTrace.method),
                            ].join(" ")}
                          >
                            {selectedTrace.method}
                          </span>
                          <span className="text-[11px] uppercase tracking-[0.24em] text-zinc-400">
                            {selectedTrace.title}
                          </span>
                        </div>
                        <p className="mt-4 break-all text-lg font-semibold tracking-[-0.03em] text-zinc-950">
                          {selectedTrace.url}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 space-y-6">
                      <section>
                        <p className="text-xs uppercase tracking-[0.24em] text-zinc-400">Payload</p>
                        <pre className="mt-3 overflow-x-auto rounded-xl bg-zinc-950 px-4 py-4 font-mono text-sm leading-relaxed text-zinc-100">
                          {JSON.stringify(selectedTrace.payload ?? null, null, 2)}
                        </pre>
                      </section>

                      <section>
                        <p className="text-xs uppercase tracking-[0.24em] text-zinc-400">Response</p>
                        <pre className="mt-3 overflow-x-auto rounded-xl bg-zinc-950 px-4 py-4 font-mono text-sm leading-relaxed text-zinc-100">
                          {JSON.stringify(selectedTrace.response ?? null, null, 2)}
                        </pre>
                      </section>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </aside>
      ) : null}

      <Section className="pt-16 sm:pt-20">
      <div className="mx-auto space-y-16">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-zinc-500">Interactive Demo</p>
          <h1 className="mt-6 text-5xl font-semibold tracking-[-0.05em] text-zinc-950 sm:text-6xl">
            Show the API through a calm, readable interface.
          </h1>
          <p className="mt-6 text-lg leading-8 text-zinc-600">
            Register, sign in, create a listing, place a bid, and inspect the exact API payload and response for every action.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="space-y-8">
            <div className={["rounded-[2rem] border border-zinc-200/60 bg-white", isAuthenticated ? "p-6" : "p-8"].join(" ")}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-zinc-500">Authentication</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-zinc-950">
                    {isAuthenticated ? "Session active" : isRegisterMode ? "Create account" : "Sign in"}
                  </h2>
                </div>
                <div className="rounded-full bg-zinc-100 px-4 py-2 text-xs uppercase tracking-[0.24em] text-zinc-500">
                  {isAuthenticated ? "active" : "guest"}
                </div>
              </div>

              {!isAuthenticated ? (
                <>
                  {!isRegisterMode ? (
                    <form className="mt-8 space-y-4" onSubmit={handleLogin}>
                      <label className="block text-sm text-zinc-600">
                        Username
                        <input
                          className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-zinc-950 outline-none transition-colors duration-300 ease-soft focus:border-zinc-400"
                          value={credentials.username}
                          onChange={(event) =>
                            setCredentials((current) => ({ ...current, username: event.target.value }))
                          }
                        />
                      </label>
                      <label className="block text-sm text-zinc-600">
                        Password
                        <input
                          type="password"
                          className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-zinc-950 outline-none transition-colors duration-300 ease-soft focus:border-zinc-400"
                          value={credentials.password}
                          onChange={(event) =>
                            setCredentials((current) => ({ ...current, password: event.target.value }))
                          }
                        />
                      </label>
                      <div className="space-y-4">
                        <Button className="w-full" type="submit" disabled={isAuthLoading}>
                          {isAuthLoading ? "Processing" : "Sign In"}
                        </Button>
                        <NoticeCard notice={authNotice} />
                        <button
                          type="button"
                          onClick={() => {
                            setIsRegisterMode(true);
                            setAuthNotice(null);
                          }}
                          className="text-sm text-zinc-500 transition-opacity duration-300 ease-soft hover:opacity-60"
                        >
                          Need an account? Create one
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form className="mt-8 space-y-4" onSubmit={handleRegister}>
                      <label className="block text-sm text-zinc-600">
                        Username
                        <input
                          className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-zinc-950 outline-none transition-colors duration-300 ease-soft focus:border-zinc-400"
                          value={registration.username}
                          onChange={(event) =>
                            setRegistration((current) => ({ ...current, username: event.target.value }))
                          }
                        />
                      </label>
                      <label className="block text-sm text-zinc-600">
                        Email
                        <input
                          type="email"
                          className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-zinc-950 outline-none transition-colors duration-300 ease-soft focus:border-zinc-400"
                          value={registration.email}
                          onChange={(event) =>
                            setRegistration((current) => ({ ...current, email: event.target.value }))
                          }
                        />
                      </label>
                      <label className="block text-sm text-zinc-600">
                        Password
                        <input
                          type="password"
                          className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-zinc-950 outline-none transition-colors duration-300 ease-soft focus:border-zinc-400"
                          value={registration.password}
                          onChange={(event) =>
                            setRegistration((current) => ({ ...current, password: event.target.value }))
                          }
                        />
                      </label>
                      <div className="space-y-4">
                        <Button className="w-full" type="submit" variant="secondary" disabled={isRegistering}>
                          {isRegistering ? "Processing" : "Register"}
                        </Button>
                        <NoticeCard notice={authNotice} />
                        <button
                          type="button"
                          onClick={() => {
                            setIsRegisterMode(false);
                            setAuthNotice(null);
                          }}
                          className="text-sm text-zinc-500 transition-opacity duration-300 ease-soft hover:opacity-60"
                        >
                          Back to sign in
                        </button>
                      </div>
                    </form>
                  )}
                </>
              ) : (
                <div className="mt-6">
                  <div className="flex items-center justify-between gap-4 rounded-[1.5rem] bg-zinc-50 px-5 py-4">
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.24em] text-zinc-400">Signed in</p>
                      <p className="mt-2 truncate text-base font-medium text-zinc-900">
                        {tokenState?.user.username}
                      </p>
                    </div>
                    <Button type="button" variant="secondary" className="px-5 py-2.5" onClick={handleSignOut}>
                      Sign Out
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-[2rem] border border-zinc-200/60 bg-white p-8">
              <p className="text-sm font-medium text-zinc-500">Products</p>
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
                          ? "border-zinc-950 bg-zinc-950 text-white"
                          : "border-zinc-200 bg-zinc-50 text-zinc-800 hover:bg-zinc-100",
                      ].join(" ")}
                    >
                      <p className="text-sm font-medium">{product.title}</p>
                      <p className={["mt-2 text-sm", isSelected ? "text-zinc-300" : "text-zinc-500"].join(" ")}>
                        Highest bid {product.current_highest_bid}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="rounded-[2rem] border border-zinc-200/60 bg-white p-8">
              <p className="text-sm font-medium text-zinc-500">Selected listing</p>
              {selectedProduct ? (
                <div className="mt-6 space-y-8">
                  <div className="space-y-4">
                    <h2 className="text-3xl font-semibold tracking-[-0.04em] text-zinc-950">
                      {selectedProduct.title}
                    </h2>
                    <p className="max-w-2xl text-base leading-8 text-zinc-600">
                      {selectedProduct.description}
                    </p>
                  </div>
                  {shouldShowImage ? (
                    <div className="overflow-hidden rounded-[1.75rem] bg-zinc-50">
                      <img
                        src={selectedProduct.image_url}
                        alt={selectedProduct.title}
                        className="h-[20rem] w-full object-cover"
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
                    <div className="rounded-[1.5rem] bg-zinc-50 p-5">
                      <p className="text-xs uppercase tracking-[0.24em] text-zinc-400">Location</p>
                      <p className="mt-3 text-lg font-medium text-zinc-900">{selectedProduct.location}</p>
                    </div>
                    <div className="rounded-[1.5rem] bg-zinc-50 p-5">
                      <p className="text-xs uppercase tracking-[0.24em] text-zinc-400">Starting bid</p>
                      <p className="mt-3 text-lg font-medium text-zinc-900">{selectedProduct.starting_bid}</p>
                    </div>
                    <div className="rounded-[1.5rem] bg-zinc-50 p-5">
                      <p className="text-xs uppercase tracking-[0.24em] text-zinc-400">Highest bid</p>
                      <p className="mt-3 text-lg font-medium text-zinc-900">{selectedProduct.current_highest_bid}</p>
                    </div>
                  </div>
                  {isAuthenticated ? (
                    <form className="space-y-4" onSubmit={handleBid}>
                      <label className="block text-sm text-zinc-600">
                        Place bid
                        <input
                          inputMode="decimal"
                          placeholder="200.00"
                          className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-zinc-950 outline-none transition-colors duration-300 ease-soft focus:border-zinc-400"
                          value={bidAmount}
                          onChange={(event) => setBidAmount(event.target.value)}
                        />
                      </label>
                      <div className="space-y-4">
                        <Button className="w-full" type="submit" disabled={isBidding}>
                          {isBidding ? "Processing" : "Submit Bid"}
                        </Button>
                        <NoticeCard notice={bidNotice} />
                      </div>
                    </form>
                  ) : (
                    <div className="rounded-[1.5rem] border border-zinc-200/80 bg-zinc-50/80 px-5 py-4">
                      <p className="text-sm leading-7 text-zinc-600">
                        Sign in to place a bid and show the authenticated API flow.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="mt-6 text-zinc-500">No products returned from the API yet.</p>
              )}
            </div>

            {isAuthenticated ? (
              <div className="rounded-[2rem] border border-zinc-200/60 bg-white p-8">
                <p className="text-sm font-medium text-zinc-500">Create product</p>
                <form className="mt-6 space-y-4" onSubmit={handleCreateProduct}>
                  <label className="block text-sm text-zinc-600">
                    Title
                    <input
                      className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-zinc-950 outline-none transition-colors duration-300 ease-soft focus:border-zinc-400"
                      value={productForm.title}
                      onChange={(event) =>
                        setProductForm((current) => ({ ...current, title: event.target.value }))
                      }
                    />
                  </label>
                  <label className="block text-sm text-zinc-600">
                    Description
                    <textarea
                      className="mt-2 min-h-[120px] w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-zinc-950 outline-none transition-colors duration-300 ease-soft focus:border-zinc-400"
                      value={productForm.description}
                      onChange={(event) =>
                        setProductForm((current) => ({ ...current, description: event.target.value }))
                      }
                    />
                  </label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block text-sm text-zinc-600">
                      Starting bid
                      <input
                        inputMode="decimal"
                        className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-zinc-950 outline-none transition-colors duration-300 ease-soft focus:border-zinc-400"
                        value={productForm.starting_bid}
                        onChange={(event) =>
                          setProductForm((current) => ({ ...current, starting_bid: event.target.value }))
                        }
                      />
                    </label>
                    <label className="block text-sm text-zinc-600">
                      Location
                      <input
                        className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-zinc-950 outline-none transition-colors duration-300 ease-soft focus:border-zinc-400"
                        value={productForm.location}
                        onChange={(event) =>
                          setProductForm((current) => ({ ...current, location: event.target.value }))
                        }
                      />
                    </label>
                  </div>
                  <label className="block text-sm text-zinc-600">
                    Image URL
                    <input
                      className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-zinc-950 outline-none transition-colors duration-300 ease-soft focus:border-zinc-400"
                      value={productForm.image_url}
                      onChange={(event) =>
                        setProductForm((current) => ({ ...current, image_url: event.target.value }))
                      }
                    />
                  </label>
                  <div className="space-y-4">
                    <Button className="w-full" type="submit" disabled={isCreatingProduct}>
                      {isCreatingProduct ? "Processing" : "Create Product"}
                    </Button>
                    <NoticeCard notice={productNotice} />
                  </div>
                </form>
              </div>
            ) : null}

          </div>
        </div>
      </div>
    </Section>
    </>
  );
}
