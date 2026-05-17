import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ApiTraceDrawer, type ApiTrace } from "../components/demo/ApiTraceDrawer";
import { Button } from "../components/ui/Button";
import { Section } from "../components/ui/Section";
import {
  login,
  register,
  type RegisterResponse,
  type TokenResponse,
} from "../lib/api";
import {
  formatUnixTimestamp,
  parseSafeIdTokenClaims,
  useDemoSession,
} from "../hooks/useDemoSession";

type InlineNotice = {
  tone: "success" | "error" | "info";
  title: string;
  message: string;
} | null;

type OidcStage = "idle" | "prepared" | "redirecting" | "complete";
type AuthMethod = "none" | "local" | "google";

const googleOAuthStartUrl = "http://localhost:8000/api/auth/google/start/";

const initialCredentials = {
  username: "testuser",
  password: "testpass123",
};

const initialRegistration = {
  username: "",
  email: "",
  password: "",
};

function ArrowRightIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M5 12h14m-6-6 6 6-6 6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}

function NoticeCard({ notice }: { notice: InlineNotice }) {
  if (!notice) {
    return null;
  }

  return (
    <div
      className={[
        "rounded-[1.5rem] border px-5 py-4",
        notice.tone === "error" ? "border-zinc-300 bg-zinc-50" : "border-zinc-200/80 bg-zinc-50/80",
      ].join(" ")}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-400">{notice.title}</p>
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
    return JSON.stringify(data);
  }

  return fallback;
}

export function AuthDemoPage() {
  const {
    tokenState,
    idTokenClaims,
    decodedAccessToken,
    isAuthenticated,
    setSession,
    clearSession,
  } = useDemoSession();
  const [traces, setTraces] = useState<ApiTrace[]>([]);
  const [selectedTraceId, setSelectedTraceId] = useState<number | null>(null);
  const [isTracePanelOpen, setIsTracePanelOpen] = useState(false);
  const [authMethod, setAuthMethod] = useState<AuthMethod>(idTokenClaims ? "google" : isAuthenticated ? "local" : "none");
  const [oidcStage, setOidcStage] = useState<OidcStage>(idTokenClaims ? "complete" : "idle");
  const [authNotice, setAuthNotice] = useState<InlineNotice>(null);
  const [credentials, setCredentials] = useState(initialCredentials);
  const [registration, setRegistration] = useState(initialRegistration);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const selectedTrace = useMemo(
    () => traces.find((trace) => trace.id === selectedTraceId) ?? null,
    [traces, selectedTraceId],
  );

  const isGoogleFlowComplete = authMethod === "google" && isAuthenticated;
  const isLocalSession = authMethod === "local" && isAuthenticated;
  const authStatusItems = [
    ["Local credentials", isLocalSession ? "done" : "idle"],
    ["Google redirect", oidcStage === "prepared" ? "ready" : oidcStage === "redirecting" ? "active" : isGoogleFlowComplete ? "done" : "idle"],
    ["Authorization code", isGoogleFlowComplete ? "done" : "idle"],
    ["Backend exchange", isGoogleFlowComplete ? "done" : "idle"],
    ["ID token verified", isGoogleFlowComplete ? "done" : "idle"],
    ["Backend JWT issued", isAuthenticated ? "done" : "idle"],
  ];

  function pushTrace(entry: Omit<ApiTrace, "id">) {
    const nextTrace = { id: Date.now() + Math.random(), ...entry };
    setTraces((current) => [nextTrace, ...current].slice(0, 12));
  }

  function applyAuthError(caught: unknown, fallback: string, title: string) {
    const apiError = caught as {
      status?: number;
      data?: unknown;
      log?: { method: string; url: string; body?: unknown };
    };
    setAuthNotice({
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
        category: "auth",
      });
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const access = params.get("access");
    const refresh = params.get("refresh");
    const username = params.get("username");
    const email = params.get("email");
    const id = parseInt(params.get("id") || "100", 10);
    const claims = parseSafeIdTokenClaims(params.get("id_token_claims"));

    if (access && refresh) {
      const nextTokenState: TokenResponse = {
        access,
        refresh,
        user: {
          id,
          username: username || "",
          email: email || "",
        },
      };

      setSession(nextTokenState, claims);
      setAuthMethod("google");
      setOidcStage("complete");
      setAuthNotice({
        tone: "success",
        title: "Google login success",
        message: `Signed in as ${username}. Backend-issued JWT is ready for stateless API auth.`,
      });

      pushTrace({
        title: "OIDC callback processed",
        method: "SERVER",
        url: "/api/auth/google/callback/?code=REDACTED",
        payload: { code: "REDACTED" },
        response: { authorization_code_received: true },
        status: 302,
        category: "oidc",
        summary: "Google redirected the browser back to the callback endpoint with an authorization code.",
      });
      pushTrace({
        title: "Backend token exchange",
        method: "SERVER",
        url: "https://oauth2.googleapis.com/token",
        payload: {
          grant_type: "authorization_code",
          code: "REDACTED",
          client_id: "REDACTED",
          client_secret: "REDACTED",
          redirect_uri: "http://localhost:8000/api/auth/google/callback/"
        },
        response: {
          access_token: "REDACTED",
          id_token: "REDACTED"
        },
        status: 200,
        category: "oidc",
        summary:
          "The backend exchanged the authorization code with Google's token endpoint.",
      });
      pushTrace({
        title: "Google ID token verified",
        method: "SERVER",
        url: "google.oauth2.id_token.verify_oauth2_token",
        response: claims ?? { verified: true, raw_token_exposed: false },
        status: 200,
        category: "oidc",
        summary: "The backend validated the ID token and returned only a safe decoded claims subset.",
      });
      pushTrace({
        title: "Backend JWT issued",
        method: "SERVER",
        url: "/api/auth/google/callback/",
        response: {
          access: "REDACTED",
          refresh: "REDACTED",
          user: { id, username, email },
        },
        status: 302,
        category: "auth",
        summary: "The application now uses backend-issued JWTs for authenticated API requests.",
      });

      sessionStorage.removeItem("oidc_login_started");
      window.history.replaceState({}, "", "/demo/auth");
    } else if (sessionStorage.getItem("oidc_login_started")) {
      setAuthMethod("none");
      setOidcStage("redirecting");
    } else if (idTokenClaims) {
      setAuthMethod("google");
      setOidcStage("complete");
    } else if (isAuthenticated) {
      setAuthMethod("local");
      setOidcStage("idle");
    }
  }, [idTokenClaims, isAuthenticated, setSession]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsAuthLoading(true);
    setAuthNotice(null);

    try {
      const result = await login(credentials.username, credentials.password);
      setSession(result.data, null);
      setAuthMethod("local");
      setOidcStage("idle");
      setAuthNotice({
        tone: "success",
        title: "Signed in",
        message: `Signed in as ${result.data.user.username}. Backend-issued JWT is available.`,
      });
      pushTrace({
        title: "JWT login",
        method: result.log.method,
        url: result.log.url,
        payload: result.log.body,
        response: { ...result.data, access: "REDACTED", refresh: "REDACTED" },
        status: result.status,
        category: "auth",
        summary: "Username and password login returned a backend-issued JWT.",
      });
      setIsRegisterMode(false);
    } catch (caught) {
      applyAuthError(caught, "Login failed.", "JWT login failed");
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
        category: "auth",
        summary: "A local demo account was created through the registration endpoint.",
      });
      setRegistration(initialRegistration);
      setCredentials({ username: registeredUser.username, password: "" });
      setIsRegisterMode(false);
    } catch (caught) {
      applyAuthError(caught, "Registration failed.", "User registration failed");
    } finally {
      setIsRegistering(false);
    }
  }

  function handleSignOut() {
    clearSession();
    setAuthMethod("none");
    setOidcStage("idle");
    setAuthNotice({
      tone: "info",
      title: "Signed out",
      message: "The local demo JWT state has been cleared.",
    });
  }

  function handleGoogleLogin() {
    setAuthMethod("none");
    setOidcStage("prepared");
    setAuthNotice({
      tone: "info",
      title: "Google sign-in ready",
      message: "The OIDC flow is ready. Continue to Google when you want to leave this page.",
    });
    pushTrace({
      title: "Google sign-in prepared",
      method: "UI",
      url: googleOAuthStartUrl,
      payload: {
        client_id: "REDACTED",
        redirect_uri: "http://localhost:8000/api/auth/google/callback/",
        response_type: "code",
        scope: "openid email profile",
        prompt: "consent",
      },
      response: { next_step: "Continue to Google" },
      category: "oidc",
      summary: "Frontend state is prepared so the Google redirect can be observed before navigation.",
    });
  }

  function handleContinueToGoogle() {
    setOidcStage("redirecting");
    setAuthNotice({
      tone: "info",
      title: "Continuing to Google",
      message: "The backend will start the OIDC authorization code flow with Google.",
    });
    sessionStorage.setItem("oidc_login_started", "true");
    pushTrace({
      title: "OIDC authorization request",
      method: "GET",
      url: googleOAuthStartUrl,
      payload: {
        response_type: "code",
        scope: "openid email profile",
        prompt: "consent",
      },
      response: { redirect_to: "https://accounts.google.com/o/oauth2/v2/auth" },
      status: 302,
      category: "oidc",
      summary: "The browser is navigating to the backend endpoint that starts Google OIDC.",
    });
    window.location.href = googleOAuthStartUrl;
  }

  return (
    <>
      <ApiTraceDrawer
        title="Auth observability"
        description="Inspect OIDC and backend-issued JWT events without exposing raw provider tokens."
        traces={traces}
        selectedTrace={selectedTrace}
        isOpen={isTracePanelOpen}
        onToggle={() => setIsTracePanelOpen((current) => !current)}
        onSelectTrace={setSelectedTraceId}
      />

      <Section className="!pb-14 !pt-8 sm:!py-10 lg:!py-12">
        <div className="mx-auto space-y-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.34em] text-zinc-500">Auth Showcase</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-zinc-950 sm:text-4xl">
                Authentication control center.
              </h1>
            </div>
            <div className="rounded-full bg-zinc-100 px-4 py-2 text-xs uppercase tracking-[0.24em] text-zinc-500">
              {isAuthenticated ? "Stateless JWT" : "Guest"}
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-[2rem] border border-zinc-200/60 bg-white p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-zinc-500">Authentication control</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-zinc-950">
                    {isAuthenticated ? "Backend-issued JWT ready" : "Sign in"}
                  </h2>
                </div>
                <div className="rounded-full bg-zinc-100 px-4 py-2 text-xs uppercase tracking-[0.24em] text-zinc-500">
                  {isAuthenticated ? "active" : "guest"}
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {isAuthenticated ? (
                  <div className="rounded-[1.5rem] bg-zinc-50 p-5">
                    <p className="text-xs uppercase tracking-[0.24em] text-zinc-400">Signed in as</p>
                    <p className="mt-2 truncate text-lg font-semibold text-zinc-950">
                      {tokenState?.user.username}
                    </p>
                    <p className="mt-2 truncate text-sm text-zinc-500">{tokenState?.user.email}</p>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <Button type="button" variant="secondary" onClick={handleSignOut}>
                        Sign Out
                      </Button>
                      <Link
                        to="/demo/app"
                        className="inline-flex items-center justify-center rounded-full bg-zinc-950 px-6 py-3 text-sm font-medium text-white transition-all duration-300 ease-soft hover:opacity-90"
                      >
                        Open Auction App
                      </Link>
                    </div>
                  </div>
                ) : (
                  <>
                    {!isRegisterMode ? (
                      <form className="space-y-4" onSubmit={handleLogin}>
                        <label className="block text-sm text-zinc-600">
                          Username or email
                          <input
                            aria-label="Username or email"
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
                            aria-label="Password"
                            type="password"
                            className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-zinc-950 outline-none transition-colors duration-300 ease-soft focus:border-zinc-400"
                            value={credentials.password}
                            onChange={(event) =>
                              setCredentials((current) => ({ ...current, password: event.target.value }))
                            }
                          />
                        </label>
                        <Button className="w-full" type="submit" disabled={isAuthLoading}>
                          {isAuthLoading ? "Processing" : "Sign In"}
                        </Button>
                      </form>
                    ) : (
                      <form className="space-y-4" onSubmit={handleRegister}>
                        <label className="block text-sm text-zinc-600">
                          Username
                          <input
                            aria-label="Register username"
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
                            aria-label="Register email"
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
                            aria-label="Register password"
                            type="password"
                            className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-zinc-950 outline-none transition-colors duration-300 ease-soft focus:border-zinc-400"
                            value={registration.password}
                            onChange={(event) =>
                              setRegistration((current) => ({ ...current, password: event.target.value }))
                            }
                          />
                        </label>
                        <Button className="w-full" type="submit" disabled={isRegistering}>
                          {isRegistering ? "Processing" : "Create Account"}
                        </Button>
                      </form>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setIsRegisterMode((current) => !current);
                        setAuthNotice(null);
                      }}
                      className="text-sm text-zinc-500 transition-opacity duration-300 ease-soft hover:opacity-60"
                    >
                      {isRegisterMode ? "Already have an account? Sign in" : "Need an account? Create one"}
                    </button>

                    <div className="flex items-center gap-4">
                      <div className="h-px flex-1 bg-zinc-200" />
                      <span className="text-xs uppercase tracking-[0.24em] text-zinc-400">or</span>
                      <div className="h-px flex-1 bg-zinc-200" />
                    </div>

                    {oidcStage === "prepared" ? (
                      <Button type="button" className="w-full gap-3 border-blue-100 bg-blue-50 text-blue-800 hover:bg-blue-100" variant="secondary" onClick={handleContinueToGoogle}>
                        Continue to Google
                        <ArrowRightIcon />
                      </Button>
                    ) : (
                      <Button type="button" className="w-full gap-3" variant="secondary" onClick={handleGoogleLogin}>
                        <GoogleIcon />
                        Sign in with Google
                      </Button>
                    )}
                    <NoticeCard notice={authNotice} />
                  </>
                )}
              </div>
            </div>

            <div className="rounded-[2rem] border border-zinc-200/60 bg-white p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-zinc-500">Flow status</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-zinc-950">
                    {isLocalSession ? "Local JWT auth" : "OIDC pipeline"}
                  </h2>
                </div>
                <div
                  className={[
                    "rounded-full px-4 py-2 text-xs uppercase tracking-[0.24em]",
                    isGoogleFlowComplete
                      ? "bg-emerald-50 text-emerald-700"
                      : isLocalSession
                        ? "bg-zinc-100 text-zinc-600"
                        : oidcStage === "prepared"
                          ? "bg-blue-50 text-blue-700"
                          : oidcStage === "redirecting"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-zinc-100 text-zinc-500",
                  ].join(" ")}
                >
                  {isGoogleFlowComplete ? "OIDC complete" : isLocalSession ? "Local auth" : oidcStage === "prepared" ? "Ready" : oidcStage === "redirecting" ? "Continuing" : "Idle"}
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {authStatusItems.map(([label, state]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between gap-4 rounded-[1.1rem] bg-zinc-50 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={[
                          "h-2.5 w-2.5 rounded-full",
                          state === "done" ? "bg-emerald-500" : state === "active" ? "bg-blue-500" : "bg-zinc-300",
                        ].join(" ")}
                      />
                      <span className="text-sm font-medium text-zinc-800">{label}</span>
                    </div>
                    <span
                      className={[
                        "rounded-full px-3 py-1 text-xs font-medium",
                        state === "done"
                          ? "bg-emerald-50 text-emerald-700"
                          : state === "ready"
                            ? "bg-blue-50 text-blue-700"
                          : state === "active"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-zinc-100 text-zinc-500",
                      ].join(" ")}
                    >
                      {state === "done" ? "ok" : state === "ready" ? "ready" : state === "active" ? "pending" : "wait"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-zinc-200/60 bg-white p-6">
            <div>
              <p className="text-sm font-medium text-zinc-500">Token inspector</p>
              <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-zinc-950">
                Verified claims and backend-issued JWT.
              </h2>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <div className="rounded-[1.5rem] bg-zinc-50 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-zinc-400">Google ID token claims</p>
                <div className="mt-4 grid gap-3 text-sm">
                  {[
                    ["sub", idTokenClaims?.sub ?? "Not available"],
                    ["email", idTokenClaims?.email ?? tokenState?.user.email ?? "Not available"],
                    ["iss", idTokenClaims?.iss ?? "Not available"],
                    ["aud", idTokenClaims?.aud ?? "Not available"],
                    ["exp", formatUnixTimestamp(idTokenClaims?.exp)],
                  ].map(([label, value]) => (
                    <div key={label} className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3">
                      <span className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-400">{label}</span>
                      <span className="min-w-0 break-words text-zinc-800">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.5rem] bg-zinc-50 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-zinc-400">Backend-issued JWT</p>
                <div className="mt-4 grid gap-3 text-sm">
                  {[
                    ["user_id", String(decodedAccessToken?.user_id ?? tokenState?.user.id ?? "Not available")],
                    ["token_type", String(decodedAccessToken?.token_type ?? "access")],
                    [
                      "exp",
                      typeof decodedAccessToken?.exp === "number"
                        ? formatUnixTimestamp(decodedAccessToken.exp)
                        : "Not available",
                    ],
                  ].map(([label, value]) => (
                    <div key={label} className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3">
                      <span className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-400">{label}</span>
                      <span className="min-w-0 break-words text-zinc-800">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
