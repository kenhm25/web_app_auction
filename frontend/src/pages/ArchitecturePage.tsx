import { Section } from "../components/ui/Section";

const platformRows = [
  ["Frontend", "React + Vite + TypeScript"],
  ["Application", "Django REST Framework"],
  ["Authentication", "Simple JWT"],
  ["Auth Standards", "OAuth 2.0 + OpenID Connect"],
  ["Database", "PostgreSQL"],
  ["Container", "Docker + Gunicorn"],
  ["Orchestration", "Kubernetes manifests"],
];

const backendHighlights = [
  "Google sign-in uses the OIDC authorization code flow while the app keeps API access on backend-issued JWTs.",
  "The HTTPS callback exchanges the authorization code server-side, verifies the ID token, and returns safe session details to React.",
  "Product creation derives seller identity from the authenticated request.",
  "Bidding writes are protected with transaction.atomic and select_for_update.",
];

const oidcFlow = [
  ["1", "React opens /api/auth/google/start/ and records a redacted API trace."],
  ["2", "Google redirects to the backend callback with an authorization code over HTTPS."],
  ["3", "The backend exchanges the code, verifies OIDC claims, and issues app JWTs."],
];

export function ArchitecturePage() {
  return (
    <>
      <Section className="pt-16 sm:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-zinc-500">Architecture</p>
          <h1 className="mt-6 text-5xl font-semibold tracking-[-0.05em] text-zinc-950 sm:text-6xl">
            A backend-first project with a deployment-aware narrative.
          </h1>
          <p className="mt-6 text-lg leading-8 text-zinc-600">
            This page reframes the codebase as a system: OIDC sign-in, JWT issuance, request handling, transactional guarantees, packaging, and production deployment all stay visible and easy to discuss.
          </p>
        </div>
      </Section>

      <Section className="bg-zinc-50/50">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-zinc-500">Platform Summary</p>
            <h2 className="text-4xl font-semibold tracking-[-0.04em] text-zinc-950">
              Each layer has a clear role.
            </h2>
            <p className="text-lg leading-8 text-zinc-600">
              The frontend presents routed product flows and authentication touchpoints. OAuth 2.0, OIDC, and JWT-based backend controls keep identity, validation, and bidding integrity explicit.
            </p>
          </div>
          <div className="rounded-[2rem] border border-zinc-200/60 bg-white p-8">
            <dl className="space-y-5">
              {platformRows.map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-6 border-b border-zinc-100 pb-5 last:border-b-0 last:pb-0">
                  <dt className="text-sm uppercase tracking-[0.24em] text-zinc-400">{label}</dt>
                  <dd className="text-right text-base font-medium text-zinc-900">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </Section>

      <Section>
        <div className="grid gap-8 lg:grid-cols-2">
          {backendHighlights.map((item) => (
            <article key={item} className="rounded-[2rem] border border-zinc-200/60 bg-white p-8">
              <p className="text-sm leading-8 text-zinc-700">{item}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section className="bg-zinc-50/50">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-zinc-500">OIDC Runtime</p>
            <h2 className="text-4xl font-semibold tracking-[-0.04em] text-zinc-950">
              Google identity enters once; app JWTs carry the API session.
            </h2>
          </div>
          <div className="rounded-[2rem] border border-zinc-200/60 bg-white p-8">
            <ol className="space-y-5">
              {oidcFlow.map(([step, detail]) => (
                <li key={step} className="grid grid-cols-[2rem_1fr] gap-4 border-b border-zinc-100 pb-5 last:border-b-0 last:pb-0">
                  <span className="text-sm font-semibold text-zinc-400">{step}</span>
                  <p className="text-sm leading-7 text-zinc-700">{detail}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </Section>
    </>
  );
}
