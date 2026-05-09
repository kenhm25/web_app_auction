import { Section } from "../ui/Section";

const requestFlow = ["Client", "Django REST API", "Transaction Layer", "PostgreSQL"];
const deployFlow = ["GitHub Actions", "Docker Image", "Kubernetes", "Rolling Update"];

export function ArchitectureSection() {
  return (
    <Section>
      <div className="mx-auto grid gap-16 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-8">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-zinc-500">System Flow</p>
          <h2 className="text-4xl font-semibold tracking-[-0.04em] text-zinc-950 sm:text-5xl">
            Built to explain behavior, not hide it behind a dashboard.
          </h2>
          <p className="max-w-2xl text-lg leading-8 text-zinc-600">
            The landing experience focuses on how a request moves through authentication, bidding rules, transactional protection, and persistence. The deployment view extends that same story into CI and infrastructure.
          </p>
        </div>
        <div className="rounded-[2rem] border border-zinc-200/60 bg-white p-8 shadow-soft">
          <div className="space-y-6">
            <p className="text-sm font-medium text-zinc-500">Runtime architecture</p>
            <ol className="space-y-4">
              {requestFlow.map((item) => (
                <li key={item} className="rounded-2xl bg-zinc-50 px-5 py-4 text-sm text-zinc-700">
                  {item}
                </li>
              ))}
            </ol>
          </div>
          <div className="mt-10 space-y-6 border-t border-zinc-200/60 pt-8">
            <p className="text-sm font-medium text-zinc-500">Deployment flow</p>
            <ol className="space-y-4">
              {deployFlow.map((item) => (
                <li key={item} className="rounded-2xl bg-zinc-50 px-5 py-4 text-sm text-zinc-700">
                  {item}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </Section>
  );
}
