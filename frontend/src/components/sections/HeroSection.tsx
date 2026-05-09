import { Link } from "react-router-dom";
import { showcaseStats } from "../../lib/constants";
import { Button } from "../ui/Button";
import { Section } from "../ui/Section";

export function HeroSection() {
  return (
    <Section className="pt-16 sm:pt-24 lg:pt-32" containerClassName="text-center">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-8">
        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-zinc-500">
          Backend System Showcase
        </p>
        <h1 className="max-w-4xl text-5xl font-semibold tracking-[-0.05em] text-zinc-950 sm:text-7xl lg:text-[6.5rem] lg:leading-[0.92]">
          Concurrency-safe auction infrastructure, presented like a product.
        </h1>
        <p className="max-w-2xl text-lg leading-8 text-zinc-600 sm:text-xl">
          A minimal frontend layer that helps interviewers understand authentication, bidding integrity, and deployment design without changing the backend architecture.
        </p>
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <Link to="/demo">
            <Button>View Demo</Button>
          </Link>
          <Link to="/architecture">
            <Button variant="secondary">Architecture</Button>
          </Link>
        </div>
        <div className="grid w-full gap-6 border-t border-zinc-200/60 pt-10 sm:grid-cols-3">
          {showcaseStats.map((item) => (
            <div key={item.label} className="space-y-2">
              <p className="text-xs uppercase tracking-[0.28em] text-zinc-400">{item.label}</p>
              <p className="text-sm font-medium text-zinc-900">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
