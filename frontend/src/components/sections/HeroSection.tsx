import { Link } from "react-router-dom";
import { showcaseStats } from "../../lib/constants";
import { Button } from "../ui/Button";
import { Section } from "../ui/Section";

export function HeroSection() {
  return (
    <Section className="pt-10 sm:pt-16 lg:pt-20">
      <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="max-w-3xl">
          <div className="inline-flex rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold uppercase text-zinc-500 shadow-sm">
            Backend Engineering Showcase
          </div>
          <h1 className="mt-8 text-5xl font-semibold leading-[1.04] text-zinc-950 sm:text-6xl lg:text-6xl">
            Transaction-safe auction APIs, shaped for production review.
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-zinc-600 sm:text-xl">
            A JWT-based auction demo focused on DRF API boundaries, PostgreSQL row-level locking, OpenAPI documentation, and Kubernetes-native deployment.
          </p>
          <div className="mt-9 flex flex-col gap-4 sm:flex-row">
            <Link to="/demo">
              <Button>Open API Demo</Button>
            </Link>
            <Link to="/race-condition">
              <Button variant="secondary">View Locking Demo</Button>
            </Link>
          </div>
          <div className="mt-12 grid max-w-2xl gap-5 border-t border-zinc-200/70 pt-8 sm:grid-cols-3">
            {showcaseStats.map((item) => (
              <div key={item.label} className="space-y-2">
                <p className="text-xs uppercase text-zinc-400">{item.label}</p>
                <p className="text-sm font-medium text-zinc-900">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-zinc-200/70 bg-white p-6 shadow-soft">
          <div className="flex items-center gap-2 border-b border-zinc-100 pb-5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
            <p className="ml-2 text-xs uppercase text-zinc-400">request path</p>
          </div>
          <div className="mt-6 divide-y divide-zinc-100">
            {[
              ["01", "React client", "JWT bearer request"],
              ["02", "DRF API", "serializer validation and permissions"],
              ["03", "Transaction boundary", "atomic write with row lock"],
              ["04", "PostgreSQL", "highest bid as source of truth"],
              ["05", "Kubernetes", "service and ingress routing"],
            ].map(([step, title, detail]) => (
              <div key={step} className="grid grid-cols-[2.75rem_1fr] gap-4 py-4 first:pt-0 last:pb-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-950 text-xs font-semibold text-white">
                  {step}
                </div>
                <div>
                  <p className="text-base font-semibold text-zinc-950">{title}</p>
                  <p className="mt-1 text-sm leading-6 text-zinc-500">{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}
