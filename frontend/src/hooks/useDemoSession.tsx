import { createContext, PropsWithChildren, useContext, useMemo, useState } from "react";
import type { TokenResponse } from "../lib/api";

export type SafeIdTokenClaims = {
  sub?: string;
  email?: string;
  iss?: string;
  aud?: string;
  exp?: number;
};

type StoredDemoSession = {
  tokenState: TokenResponse | null;
  idTokenClaims: SafeIdTokenClaims | null;
};

type DemoSessionContextValue = StoredDemoSession & {
  decodedAccessToken: Record<string, unknown> | null;
  isAuthenticated: boolean;
  setSession: (tokenState: TokenResponse, idTokenClaims?: SafeIdTokenClaims | null) => void;
  clearSession: () => void;
};

const storageKey = "auction_demo_session";

const DemoSessionContext = createContext<DemoSessionContextValue | null>(null);

function readStoredSession(): StoredDemoSession {
  try {
    const raw = sessionStorage.getItem(storageKey);
    if (!raw) {
      return { tokenState: null, idTokenClaims: null };
    }

    const parsed = JSON.parse(raw) as StoredDemoSession;
    return {
      tokenState: parsed.tokenState ?? null,
      idTokenClaims: parsed.idTokenClaims ?? null,
    };
  } catch {
    return { tokenState: null, idTokenClaims: null };
  }
}

function decodeJwtPayload(token?: string): Record<string, unknown> | null {
  if (!token) {
    return null;
  }

  try {
    const payload = token.split(".")[1];
    if (!payload) {
      return null;
    }

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
    return JSON.parse(window.atob(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function parseSafeIdTokenClaims(value: string | null): SafeIdTokenClaims | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as SafeIdTokenClaims;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function formatUnixTimestamp(value?: number, fallback = "Not provided") {
  if (!value) {
    return fallback;
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value * 1000));
}

export function DemoSessionProvider({ children }: PropsWithChildren) {
  const [session, setStoredSession] = useState<StoredDemoSession>(() => readStoredSession());

  const decodedAccessToken = useMemo(
    () => decodeJwtPayload(session.tokenState?.access),
    [session.tokenState?.access],
  );

  function setSession(tokenState: TokenResponse, idTokenClaims: SafeIdTokenClaims | null = null) {
    const nextSession = { tokenState, idTokenClaims };
    setStoredSession(nextSession);
    sessionStorage.setItem(storageKey, JSON.stringify(nextSession));
  }

  function clearSession() {
    const emptySession = { tokenState: null, idTokenClaims: null };
    setStoredSession(emptySession);
    sessionStorage.removeItem(storageKey);
    sessionStorage.removeItem("oidc_login_started");
  }

  return (
    <DemoSessionContext.Provider
      value={{
        ...session,
        decodedAccessToken,
        isAuthenticated: Boolean(session.tokenState?.access),
        setSession,
        clearSession,
      }}
    >
      {children}
    </DemoSessionContext.Provider>
  );
}

export function useDemoSession() {
  const context = useContext(DemoSessionContext);
  if (!context) {
    throw new Error("useDemoSession must be used inside DemoSessionProvider");
  }

  return context;
}
