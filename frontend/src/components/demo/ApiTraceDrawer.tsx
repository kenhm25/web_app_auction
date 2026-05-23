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

const sensitiveKeys = new Set([
  "access",
  "refresh",
  "access_token",
  "refresh_token",
  "id_token",
  "token",
  "client_secret",
  "code",
  "authorization",
]);

function redactSensitiveValues(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => redactSensitiveValues(item));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => [
        key,
        sensitiveKeys.has(key.toLowerCase()) ? "REDACTED" : redactSensitiveValues(nestedValue),
      ]),
    );
  }

  return value;
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
      <style>
        {`
          @keyframes api-drawer-enter {
            from {
              opacity: 0;
              transform: translateX(18px) scale(0.985);
            }
            to {
              opacity: 1;
              transform: translateX(0) scale(1);
            }
          }

          @keyframes api-detail-enter {
            from {
              opacity: 0;
              transform: translateY(10px);
              filter: blur(3px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
              filter: blur(0);
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .api-drawer-enter,
            .api-detail-enter {
              animation: none;
            }
          }
        `}
      </style>

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
        <>
          <div className="fixed inset-0 z-20 bg-zinc-950/10 backdrop-blur-[2px] sm:hidden" onClick={onToggle} />
          <aside
            id="api-trace-panel"
            className="api-drawer-enter fixed inset-x-2 top-3 z-30 h-[calc(100%-1.5rem)] rounded-[1.75rem] border border-zinc-200/80 bg-white/95 px-5 py-6 shadow-[0_24px_80px_rgba(24,24,27,0.16)] backdrop-blur-xl sm:inset-x-auto sm:right-3 sm:w-[min(48rem,calc(100vw-1.5rem))] sm:px-6 sm:py-7"
          >
          <div className="flex h-full flex-col">
            <div className="flex items-start justify-between gap-4 pb-5">
              <div>
                <p className="text-sm font-semibold text-zinc-700">{title}</p>
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
                      className="rounded-full border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-500 shadow-sm transition-colors transition-transform duration-300 ease-soft hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-950 active:scale-[0.96]"
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
                      className="w-full rounded-[1.25rem] border border-zinc-200/80 bg-zinc-50 px-4 py-4 text-left text-zinc-900 shadow-sm transition-transform transition-colors duration-300 ease-soft hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-white hover:shadow-md active:scale-[0.99]"
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
                          <p className="mt-3 truncate text-base font-semibold tracking-[-0.02em]">{trace.url}</p>
                          {trace.summary ? (
                            <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-500">{trace.summary}</p>
                          ) : null}
                        </div>
                        <div
                          className={[
                            "inline-flex rounded-full px-3 py-1 text-xs font-semibold tabular-nums",
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
                  <div key={selectedTrace.id} className="api-detail-enter rounded-[1.5rem] border border-zinc-200/70 bg-zinc-50/80 px-5 py-5 shadow-sm">
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
                      <section className="rounded-[1.25rem] border border-zinc-200/70 bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-400">Payload</p>
                          <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-medium text-zinc-500">request</span>
                        </div>
                        <pre className="mt-3 overflow-x-auto rounded-xl bg-zinc-950 px-4 py-4 font-mono text-sm leading-relaxed text-zinc-100 shadow-inner">
                          <code>{JSON.stringify(redactSensitiveValues(selectedTrace.payload ?? null), null, 2)}</code>
                        </pre>
                      </section>

                      <section className="rounded-[1.25rem] border border-blue-100 bg-blue-50/50 p-4 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-500">Response</p>
                          <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-blue-600">backend</span>
                        </div>
                        <pre className="mt-3 overflow-x-auto rounded-xl bg-zinc-950 px-4 py-4 font-mono text-sm leading-relaxed text-zinc-100 shadow-inner">
                          <code>{JSON.stringify(redactSensitiveValues(selectedTrace.response ?? null), null, 2)}</code>
                        </pre>
                      </section>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          </aside>
        </>
      ) : null}
    </>
  );
}
