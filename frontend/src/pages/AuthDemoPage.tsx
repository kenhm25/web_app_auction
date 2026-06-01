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
import { apiBaseUrl } from "../lib/constants";
import {
  formatUnixTimestamp,
  parseSafeIdTokenClaims,
  useDemoSession,
} from "../hooks/useDemoSession";
import { useLanguage } from "../i18n/LanguageContext";

type InlineNotice = {
  tone: "success" | "error" | "info";
  title: string;
  message: string;
} | null;

type OidcStage = "idle" | "prepared" | "redirecting" | "complete";
type AuthMethod = "none" | "local" | "google";

const normalizedApiBaseUrl = apiBaseUrl.replace(/\/$/, "");
const googleOAuthStartUrl = `${normalizedApiBaseUrl}/api/auth/google/start/`;
const googleOAuthCallbackUrl = `${normalizedApiBaseUrl}/api/auth/google/callback/`;

const initialCredentials = {
  username: "",
  password: "",
};

const initialRegistration = {
  username: "",
  email: "",
  password: "",
};

const inputClasses =
  "mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-zinc-950 shadow-sm outline-none transition-all duration-300 ease-soft placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white focus:ring-4 focus:ring-zinc-950/5";

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

function formatError(data: unknown, fallback: string, messages: { sessionExpired: string; signInUnavailable: string }) {
  if (typeof data === "object" && data !== null) {
    const detailValue = (data as Record<string, unknown>).detail;
    if (typeof detailValue === "string") {
      const normalized = detailValue.toLowerCase();
      if (normalized.includes("token") && normalized.includes("expired")) {
        return messages.sessionExpired;
      }
      if (normalized.includes("temporarily") || normalized.includes("unavailable")) {
        return messages.signInUnavailable;
      }
      return detailValue;
    }
  }

  return fallback;
}

function oidcErrorMessage(
  params: URLSearchParams,
  messages: { googleCancelled: string; sessionExpired: string; signInUnavailable: string },
) {
  const rawError = params.get("error") || params.get("detail") || params.get("message");

  if (!rawError) {
    return null;
  }

  const normalized = rawError.toLowerCase();
  if (normalized.includes("access_denied") || normalized.includes("cancel")) {
    return messages.googleCancelled;
  }
  if (normalized.includes("expired") || normalized.includes("state")) {
    return messages.sessionExpired;
  }

  return messages.signInUnavailable;
}

export function AuthDemoPage() {
  const { t } = useLanguage();
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
  const authProviderLabel = idTokenClaims
    ? t.auth.authProviderGoogle
    : isAuthenticated
      ? t.auth.authProviderLocal
      : t.auth.authProviderGuest;
  const tokenExpiry =
    typeof decodedAccessToken?.exp === "number" ? formatUnixTimestamp(decodedAccessToken.exp) : t.common.notProvided;
  const authStatusItems = [
    [t.auth.localCredentials, isLocalSession ? "done" : "idle"],
    [t.auth.googleRedirect, oidcStage === "prepared" ? "ready" : oidcStage === "redirecting" ? "active" : isGoogleFlowComplete ? "done" : "idle"],
    [t.auth.authorizationCode, isGoogleFlowComplete ? "done" : "idle"],
    [t.auth.backendExchange, isGoogleFlowComplete ? "done" : "idle"],
    [t.auth.idTokenVerified, isGoogleFlowComplete ? "done" : "idle"],
    [t.auth.backendJwtIssued, isAuthenticated ? "done" : "idle"],
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
      message: formatError(apiError?.data, fallback, t.auth),
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
    const oidcError = oidcErrorMessage(params, t.auth);

    if (oidcError) {
      setAuthMethod("none");
      setOidcStage("idle");
      setAuthNotice({
        tone: "error",
        title: t.auth.googleFailed,
        message: oidcError,
      });
      pushTrace({
        title: t.auth.oidcCallbackFailed,
        method: "SERVER",
        url: "/api/auth/google/callback/",
        payload: { error: params.get("error") ?? "REDACTED", state: params.get("state") ? "VERIFIED" : "MISSING" },
        response: { message: oidcError },
        status: 400,
        category: "oidc",
        summary: t.auth.oidcCallbackFailedSummary,
      });
      sessionStorage.removeItem("oidc_login_started");
      window.history.replaceState({}, "", "/demo/auth");
    } else if (access && refresh) {
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
        title: t.auth.googleLoginSuccess,
        message: t.auth.googleLoginSuccessMessage(username),
      });

      pushTrace({
        title: t.auth.oidcCallbackProcessed,
        method: "SERVER",
        url: "/api/auth/google/callback/?code=REDACTED",
        payload: { code: "REDACTED", state: "VERIFIED_ONCE_FROM_SESSION" },
        response: { authorization_code_received: true, state_verified: true },
        status: 302,
        category: "oidc",
        summary: t.auth.oidcCallbackProcessedSummary,
      });
      pushTrace({
        title: t.auth.backendTokenExchange,
        method: "SERVER",
        url: "https://oauth2.googleapis.com/token",
        payload: {
          grant_type: "authorization_code",
          code: "REDACTED",
          client_id: "REDACTED",
          client_secret: "REDACTED",
          redirect_uri: googleOAuthCallbackUrl,
        },
        response: {
          access_token: "REDACTED",
          id_token: "REDACTED",
        },
        status: 200,
        category: "oidc",
        summary:
          t.auth.backendTokenExchangeSummary,
      });
      pushTrace({
        title: t.auth.googleIdTokenVerified,
        method: "SERVER",
        url: "google.oauth2.id_token.verify_oauth2_token",
        response: claims
          ? { ...claims, nonce_verified: true }
          : { verified: true, nonce_verified: true, raw_token_exposed: false },
        status: 200,
        category: "oidc",
        summary: t.auth.googleIdTokenVerifiedSummary,
      });
      pushTrace({
        title: t.auth.backendJwtIssuedTrace,
        method: "SERVER",
        url: "/api/auth/google/callback/",
        response: {
          redirect_to_frontend: "/demo/auth",
          access: "REDACTED",
          refresh: "REDACTED",
          user: { id, username, email },
        },
        status: 302,
        category: "auth",
        summary: t.auth.backendJwtIssuedSummary,
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
  }, [idTokenClaims, isAuthenticated, setSession, t.auth]);

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
        title: t.auth.signedIn,
        message: t.auth.signedInMessage(result.data.user.username),
      });
      pushTrace({
        title: t.auth.jwtLogin,
        method: result.log.method,
        url: result.log.url,
        payload: result.log.body,
        response: { ...result.data, access: "REDACTED", refresh: "REDACTED" },
        status: result.status,
        category: "auth",
        summary: t.auth.jwtLoginSummary,
      });
      setIsRegisterMode(false);
    } catch (caught) {
      applyAuthError(caught, t.auth.loginFailed, t.auth.jwtLoginFailed);
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
        title: t.auth.registered,
        message: t.auth.registeredMessage(registeredUser.username),
      });
      pushTrace({
        title: t.auth.userRegistration,
        method: result.log.method,
        url: result.log.url,
        payload: result.log.body,
        response: result.data,
        status: result.status,
        category: "auth",
        summary: t.auth.userRegistrationSummary,
      });
      setRegistration(initialRegistration);
      setCredentials({ username: registeredUser.username, password: "" });
      setIsRegisterMode(false);
    } catch (caught) {
      applyAuthError(caught, t.auth.registrationFailed, t.auth.userRegistrationFailed);
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
      title: t.auth.signedOut,
      message: t.auth.signedOutMessage,
    });
  }

  function handleGoogleLogin() {
    setAuthMethod("none");
    setOidcStage("prepared");
    setAuthNotice({
      tone: "info",
      title: t.auth.googleReady,
      message: t.auth.googleReadyMessage,
    });
    pushTrace({
      title: t.auth.googlePrepared,
      method: "UI",
      url: googleOAuthStartUrl,
      payload: {
        client_id: "REDACTED",
        redirect_uri: googleOAuthCallbackUrl,
        response_type: "code",
        scope: "openid email profile",
        prompt: "consent",
        state: "SIGNED_AND_STORED_IN_SESSION",
        nonce: "GENERATED_SERVER_SIDE",
      },
      response: { next_step: t.auth.continueGoogle },
      category: "oidc",
      summary: t.auth.googlePreparedSummary,
    });
  }

  function handleContinueToGoogle() {
    setOidcStage("redirecting");
    setAuthNotice({
      tone: "info",
      title: t.auth.continueToGoogleTitle,
      message: t.auth.continueToGoogleMessage,
    });
    sessionStorage.setItem("oidc_login_started", "true");
    pushTrace({
      title: t.auth.oidcAuthorizationRequest,
      method: "GET",
      url: googleOAuthStartUrl,
      payload: {
        response_type: "code",
        scope: "openid email profile",
        prompt: "consent",
        state: "SIGNED_AND_STORED_IN_SESSION",
        nonce: "GENERATED_SERVER_SIDE",
      },
      response: { redirect_to: "https://accounts.google.com/o/oauth2/v2/auth" },
      status: 302,
      category: "oidc",
      summary: t.auth.oidcAuthorizationSummary,
    });
    window.location.href = googleOAuthStartUrl;
  }

  return (
    <>
      <ApiTraceDrawer
        title={t.auth.drawerTitle}
        description={t.auth.drawerDescription}
        traces={traces}
        selectedTrace={selectedTrace}
        isOpen={isTracePanelOpen}
        onToggle={() => setIsTracePanelOpen((current) => !current)}
        onSelectTrace={setSelectedTraceId}
      />

      <Section className="!pb-16 !pt-10 sm:!py-14 lg:!py-16 bg-zinc-50/70">
        <div className="mx-auto space-y-7">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.34em] text-blue-600">{t.auth.eyebrow}</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-zinc-950 sm:text-5xl">
                {t.auth.title}
              </h1>
            </div>
            <div className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs uppercase tracking-[0.24em] text-zinc-600 shadow-sm">
              {isAuthenticated ? t.auth.authenticatedBadge : t.common.guestLabel}
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-[2rem] border border-zinc-200/70 bg-white p-6 shadow-soft sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-zinc-500">{t.auth.controlLabel}</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-zinc-950">
                    {isAuthenticated ? t.auth.jwtReady : t.auth.signIn}
                  </h2>
                </div>
                <div className="rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-xs uppercase tracking-[0.24em] text-zinc-600">
                  {isAuthenticated ? t.common.active : t.common.guest}
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {isAuthenticated ? (
                  <div className="rounded-[1.5rem] border border-zinc-200/70 bg-zinc-50 p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-zinc-400">{t.common.session}</p>
                        <p className="mt-2 text-lg font-semibold text-zinc-950">
                          {idTokenClaims ? t.auth.signedInWithGoogle : t.auth.signedIn}
                        </p>
                      </div>
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                        {t.common.active}
                      </span>
                    </div>
                    <dl className="mt-5 space-y-3 text-sm">
                      {[
                        [t.common.provider, authProviderLabel],
                        [t.common.username, tokenState?.user.username || t.common.notProvided],
                        [t.common.email, tokenState?.user.email || t.common.notProvided],
                        [t.auth.tokenExpiry, tokenExpiry],
                      ].map(([label, value]) => (
                        <div key={label} className="flex items-start justify-between gap-4">
                          <dt className="text-zinc-500">{label}</dt>
                          <dd className="min-w-0 break-words text-right font-medium text-zinc-900">{value}</dd>
                        </div>
                      ))}
                    </dl>
                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      <Button type="button" variant="secondary" className="hover:border-zinc-300 hover:bg-white hover:shadow-sm" onClick={handleSignOut}>
                        {t.auth.signOut}
                      </Button>
                      <Link
                        to="/demo/app"
                        className="inline-flex items-center justify-center rounded-full bg-zinc-950 px-6 py-3 text-sm font-medium text-white shadow-sm transition-all duration-300 ease-soft hover:-translate-y-0.5 hover:bg-zinc-800 hover:shadow-md"
                      >
                        {t.auth.openAuctionApp}
                      </Link>
                    </div>
                  </div>
                ) : (
                  <>
                    {!isRegisterMode ? (
                      <form className="space-y-4" onSubmit={handleLogin}>
                        <label className="block text-sm text-zinc-600">
                          {t.auth.usernameOrEmail}
                          <input
                            aria-label={t.auth.usernameOrEmail}
                            className={inputClasses}
                            value={credentials.username}
                            onChange={(event) =>
                              setCredentials((current) => ({ ...current, username: event.target.value }))
                            }
                          />
                        </label>
                        <label className="block text-sm text-zinc-600">
                          {t.common.password}
                          <input
                            aria-label={t.common.password}
                            type="password"
                            className={inputClasses}
                            value={credentials.password}
                            onChange={(event) =>
                              setCredentials((current) => ({ ...current, password: event.target.value }))
                            }
                          />
                        </label>
                        <Button className="w-full shadow-sm hover:-translate-y-0.5 hover:bg-zinc-800 hover:shadow-md disabled:translate-y-0 disabled:opacity-60" type="submit" disabled={isAuthLoading}>
                          {isAuthLoading ? t.common.processing : t.auth.signInButton}
                        </Button>
                      </form>
                    ) : (
                      <form className="space-y-4" onSubmit={handleRegister}>
                        <label className="block text-sm text-zinc-600">
                          {t.common.username}
                          <input
                            aria-label={t.auth.registerUsername}
                            className={inputClasses}
                            value={registration.username}
                            onChange={(event) =>
                              setRegistration((current) => ({ ...current, username: event.target.value }))
                            }
                          />
                        </label>
                        <label className="block text-sm text-zinc-600">
                          {t.common.email}
                          <input
                            aria-label={t.auth.registerEmail}
                            type="email"
                            className={inputClasses}
                            value={registration.email}
                            onChange={(event) =>
                              setRegistration((current) => ({ ...current, email: event.target.value }))
                            }
                          />
                        </label>
                        <label className="block text-sm text-zinc-600">
                          {t.common.password}
                          <input
                            aria-label={t.auth.registerPassword}
                            type="password"
                            className={inputClasses}
                            value={registration.password}
                            onChange={(event) =>
                              setRegistration((current) => ({ ...current, password: event.target.value }))
                            }
                          />
                        </label>
                        <Button className="w-full shadow-sm hover:-translate-y-0.5 hover:bg-zinc-800 hover:shadow-md disabled:translate-y-0 disabled:opacity-60" type="submit" disabled={isRegistering}>
                          {isRegistering ? t.common.processing : t.auth.createAccount}
                        </Button>
                      </form>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setIsRegisterMode((current) => !current);
                        setAuthNotice(null);
                      }}
                      className="text-sm font-medium text-zinc-500 transition-colors duration-300 ease-soft hover:text-zinc-950"
                    >
                      {isRegisterMode ? t.auth.alreadyHaveAccount : t.auth.needAccount}
                    </button>

                    <div className="flex items-center gap-4">
                      <div className="h-px flex-1 bg-zinc-200" />
                      <span className="text-xs uppercase tracking-[0.24em] text-zinc-400">{t.auth.or}</span>
                      <div className="h-px flex-1 bg-zinc-200" />
                    </div>

                    {oidcStage === "prepared" ? (
                      <Button type="button" className="w-full gap-3 border-blue-100 bg-blue-50 text-blue-800 shadow-sm hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-100 hover:shadow-md" variant="secondary" onClick={handleContinueToGoogle}>
                        {t.auth.continueGoogle}
                        <ArrowRightIcon />
                      </Button>
                    ) : (
                      <Button type="button" className="w-full gap-3 shadow-sm hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-zinc-50 hover:shadow-md" variant="secondary" onClick={handleGoogleLogin}>
                        <GoogleIcon />
                        {t.auth.signInGoogle}
                      </Button>
                    )}
                    <NoticeCard notice={authNotice} />
                  </>
                )}
              </div>
            </div>

            <div className="rounded-[2rem] border border-zinc-200/70 bg-white p-6 shadow-soft sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-zinc-500">{t.auth.flowStatus}</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-zinc-950">
                    {isLocalSession ? t.auth.localJwtAuth : t.auth.oidcPipeline}
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
                  {isGoogleFlowComplete ? t.auth.oidcComplete : isLocalSession ? t.auth.localAuth : oidcStage === "prepared" ? t.common.ready : oidcStage === "redirecting" ? t.auth.continuing : t.auth.idle}
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {authStatusItems.map(([label, state]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between gap-4 rounded-[1.1rem] border border-transparent bg-zinc-50 px-4 py-3 transition-all duration-300 ease-soft hover:border-zinc-200 hover:bg-white hover:shadow-sm"
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
                      {state === "done" ? t.common.ok : state === "ready" ? t.common.ready : state === "active" ? t.common.pending : t.common.wait}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-zinc-200/70 bg-white p-6 shadow-soft sm:p-7">
            <div>
              <p className="text-sm font-medium text-zinc-500">{t.auth.tokenInspector}</p>
              <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-zinc-950">
                {t.auth.tokenInspectorTitle}
              </h2>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <div className="rounded-[1.5rem] border border-zinc-200/70 bg-zinc-50 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-zinc-400">{t.auth.googleClaims}</p>
                <div className="mt-4 grid gap-3 text-sm">
                  {[
                    ["sub", idTokenClaims?.sub ?? t.common.notAvailable],
                    ["email", idTokenClaims?.email ?? tokenState?.user.email ?? t.common.notAvailable],
                    ["iss", idTokenClaims?.iss ?? t.common.notAvailable],
                    ["aud", idTokenClaims?.aud ?? t.common.notAvailable],
                    ["exp", formatUnixTimestamp(idTokenClaims?.exp, t.common.notProvided)],
                    ["state", isGoogleFlowComplete ? t.auth.stateVerified : t.common.notAvailable],
                    ["nonce", isGoogleFlowComplete ? t.auth.nonceVerified : t.common.notAvailable],
                  ].map(([label, value]) => (
                    <div key={label} className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3">
                      <span className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-400">{label}</span>
                      <span className="min-w-0 break-words text-zinc-800">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-zinc-200/70 bg-zinc-50 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-zinc-400">{t.auth.backendJwt}</p>
                <div className="mt-4 grid gap-3 text-sm">
                  {[
                    ["user_id", String(decodedAccessToken?.user_id ?? tokenState?.user.id ?? t.common.notAvailable)],
                    ["token_type", String(decodedAccessToken?.token_type ?? "access")],
                    [
                      "exp",
                      typeof decodedAccessToken?.exp === "number"
                        ? formatUnixTimestamp(decodedAccessToken.exp)
                        : t.common.notAvailable,
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
