export type ApiTrace = {
  id: number;
  title: string;
  method: string;
  url: string;
  payload?: unknown;
  response?: unknown;
  status?: number;
  category?: "auth" | "oidc" | "product" | "bid";
  summary?: string;
};

type ApiTraceDrawerProps = {
  title: string;
  description: string;
  traces: ApiTrace[];
  selectedTrace: ApiTrace | null;
  isOpen: boolean;
  onToggle: () => void;
  onSelectTrace: (id: number | null) => void;
  onRefresh?: () => void;
};

function methodBadgeClasses(method: string) {
  if (method === "GET") {
    return "bg-zinc-100 text-zinc-700";
  }

  if (method === "SERVER") {
    return "bg-blue-50 text-blue-700";
  }

  return "bg-zinc-900 text-white";
}

function statusBadgeClasses(status?: number) {
  if (!status) {
    return "bg-zinc-100 text-zinc-500";
  }

  if (status >= 200 && status < 300) {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status >= 300 && status < 400) {
    return "bg-blue-50 text-blue-700";
  }

  return "bg-red-50 text-red-700";
}

function categoryBadgeClasses(category?: ApiTrace["category"]) {
  if (category === "oidc") {
    return "bg-blue-50 text-blue-700";
  }

  if (category === "auth") {
    return "bg-violet-50 text-violet-700";
  }

  if (category === "bid") {
    return "bg-amber-50 text-amber-700";
  }

  return "bg-zinc-100 text-zinc-600";
}

export function ApiTraceDrawer({
  title,
  description,
  traces,
  selectedTrace,
  isOpen,
  onToggle,
  onSelectTrace,
  onRefresh,
}: ApiTraceDrawerProps) {
  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-0 z-40 h-0">
        <div className="pointer-events-auto absolute right-6 top-20">
          <button
            type="button"
            onClick={() => {
              if (isOpen) {
                onSelectTrace(null);
              }
              onToggle();
            }}
            className="rounded-full border border-zinc-200 bg-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500 transition-all duration-300 ease-in-out hover:bg-zinc-50"
            aria-expanded={isOpen}
            aria-controls="api-trace-panel"
          >
            {isOpen ? "Close API" : "Open API"}
          </button>
        </div>
      </div>

      {isOpen ? (
        <aside
          id="api-trace-panel"
          className="fixed right-3 top-3 z-30 h-[calc(100%-1.5rem)] w-[min(48rem,calc(100vw-1.5rem))] rounded-2xl border border-zinc-200 bg-white px-6 py-7 transition-transform duration-300 ease-in-out"
        >
          <div className="flex h-full flex-col">
            <div className="flex items-start justify-between gap-4 pb-5">
              <div>
                <p className="text-sm font-medium text-zinc-500">{title}</p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">{description}</p>
              </div>
              <div className="w-16" />
            </div>

            {!selectedTrace ? (
              <>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.24em] text-zinc-400">Recent activity</p>
                  {onRefresh ? (
                    <button
                      type="button"
                      onClick={onRefresh}
                      className="text-sm text-zinc-500 transition-opacity duration-300 ease-in-out hover:opacity-60"
                    >
                      Refresh data
                    </button>
                  ) : null}
                </div>

                <div className="mt-5 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
                  {traces.map((trace) => (
                    <button
                      key={trace.id}
                      type="button"
                      onClick={() => onSelectTrace(trace.id)}
                      className="w-full rounded-[1.25rem] border border-zinc-200 bg-zinc-50 px-4 py-4 text-left text-zinc-900 transition-all duration-300 ease-in-out hover:bg-zinc-100"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={[
                                "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
                                categoryBadgeClasses(trace.category),
                              ].join(" ")}
                            >
                              {trace.category ?? "api"}
                            </span>
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
                          {trace.summary ? (
                            <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-500">{trace.summary}</p>
                          ) : null}
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
                    onClick={() => onSelectTrace(null)}
                    className="rounded-full border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500 transition-all duration-300 ease-in-out hover:bg-zinc-50"
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
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={[
                              "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
                              categoryBadgeClasses(selectedTrace.category),
                            ].join(" ")}
                          >
                            {selectedTrace.category ?? "api"}
                          </span>
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
                        {selectedTrace.summary ? (
                          <p className="mt-3 text-sm leading-7 text-zinc-600">{selectedTrace.summary}</p>
                        ) : null}
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
    </>
  );
}
