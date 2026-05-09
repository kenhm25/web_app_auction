import { Section } from "../ui/Section";

const features = [
  {
    title: "Authentication",
    description:
      "JWT-based login and identity boundaries make the API easy to reason about during demos and interviews.",
    detail: "Token issuance, profile lookup, and protected write operations are already supported by the backend.",
  },
  {
    title: "Bidding Integrity",
    description:
      "The core story is safe bidding under concurrency, using transactional protection instead of optimistic assumptions.",
    detail: "The interface highlights how higher bids win and how invalid bids are rejected through controlled business rules.",
  },
  {
    title: "Deployment",
    description:
      "Containerization and Kubernetes manifests turn the project into a system design conversation, not just an API walkthrough.",
    detail: "Docker, Compose, health checks, and Kubernetes resources are surfaced as first-class product capabilities.",
  },
];

export function FeatureSection() {
  return (
    <Section className="bg-zinc-50/50">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-zinc-500">Core Capabilities</p>
        <h2 className="text-4xl font-semibold tracking-[-0.04em] text-zinc-950 sm:text-5xl">
          The UI stays quiet so the system design can speak.
        </h2>
      </div>
      <div className="mt-16 grid gap-6 lg:grid-cols-3">
        {features.map((feature) => (
          <article
            key={feature.title}
            className="rounded-[2rem] border border-zinc-200/60 bg-white p-8 transition-all duration-300 ease-soft hover:border-zinc-300/60 hover:bg-zinc-50/60"
          >
            <p className="text-sm font-medium text-zinc-500">{feature.title}</p>
            <h3 className="mt-6 text-2xl font-semibold tracking-[-0.03em] text-zinc-950">
              {feature.description}
            </h3>
            <p className="mt-8 text-base leading-8 text-zinc-600">{feature.detail}</p>
          </article>
        ))}
      </div>
    </Section>
  );
}
