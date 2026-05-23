import { ArchitectureSection } from "../components/sections/ArchitectureSection";
import { FeatureSection } from "../components/sections/FeatureSection";
import { HeroSection } from "../components/sections/HeroSection";
import { ShowcaseSection } from "../components/sections/ShowcaseSection";
import { Section } from "../components/ui/Section";

const authFlow = [
  ["OIDC start", "The demo redirects through the backend so Google auth stays server-mediated."],
  ["HTTPS callback", "Google returns an authorization code to the backend callback endpoint."],
  ["JWT issuance", "The backend verifies the ID token, maps the user, and issues app JWTs."],
];

export function LandingPage() {
  return (
    <>
      <HeroSection />
      <FeatureSection />
      <Section>
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase text-zinc-500">OIDC Sign-In</p>
            <h2 className="mt-6 text-4xl font-semibold leading-tight text-zinc-950 sm:text-5xl">
              Google login now lands in the same observable demo flow.
            </h2>
            <p className="mt-6 text-lg leading-8 text-zinc-600">
              The React demo shows both username/password JWT login and Google OIDC authorization code flow, with callback handling and token-safe API traces visible in the browser.
            </p>
          </div>

          <div className="grid gap-5">
            {authFlow.map(([label, detail]) => (
              <article key={label} className="border-b border-zinc-200/70 pb-8 last:border-b-0 last:pb-0">
                <p className="text-sm font-medium text-zinc-500">{label}</p>
                <p className="mt-4 text-2xl font-semibold leading-snug text-zinc-950">{detail}</p>
              </article>
            ))}
          </div>
        </div>
      </Section>
      <ArchitectureSection />
      <ShowcaseSection />
    </>
  );
}
