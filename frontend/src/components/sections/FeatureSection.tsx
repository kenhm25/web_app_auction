import { Section } from "../ui/Section";

const features = [
  {
    title: "Stateless API Boundary",
    description:
      "JWT bearer tokens keep authenticated API access explicit without server-side session coupling.",
    detail: "Registration, login, profile access, product creation, and bid submission stay behind a simple DRF REST contract.",
  },
  {
    title: "Transactional Consistency",
    description:
      "The highest bid is handled as a contention-sensitive invariant, not a client-side assumption.",
    detail: "Bid writes are protected with transaction.atomic() and select_for_update() so concurrent requests serialize at the database row.",
  },
  {
    title: "Deployment Architecture",
    description:
      "The project is packaged and routed like a small production service rather than a local-only demo.",
    detail: "Docker images, Gunicorn, PostgreSQL, Kubernetes Services, Ingress, and CI validation are visible in the system narrative.",
  },
];

export function FeatureSection() {
  return (
    <Section className="bg-zinc-50/60">
      <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase text-zinc-500">Engineering Highlights</p>
          <h2 className="mt-6 text-4xl font-semibold leading-tight text-zinc-950 sm:text-5xl">
            Built around the backend decisions an interviewer will inspect.
          </h2>
          <p className="mt-6 text-lg leading-8 text-zinc-600">
            The interface foregrounds transaction safety, API boundaries, and deployment shape so the project reads as a backend system, not a CRUD screen.
          </p>
        </div>

        <div className="grid gap-5">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="border-b border-zinc-200/70 pb-8 last:border-b-0 last:pb-0"
            >
              <p className="text-sm font-medium text-zinc-500">{feature.title}</p>
              <h3 className="mt-4 text-2xl font-semibold leading-snug text-zinc-950">
                {feature.description}
              </h3>
              <p className="mt-4 text-base leading-8 text-zinc-600">{feature.detail}</p>
            </article>
          ))}
        </div>
      </div>
    </Section>
  );
}
