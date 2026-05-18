import { Section } from "../ui/Section";

const requestFlow = [
  ["Client", "React + Vite presents the auction workflow"],
  ["API", "DRF validates JWT-backed requests"],
  ["Transaction", "Bid writes enter an atomic boundary"],
  ["Database", "PostgreSQL serializes row-level updates"],
];

const deployFlow = [
  ["Validate", "Backend tests and frontend build"],
  ["Package", "Docker images for API and UI"],
  ["Run", "Gunicorn and Nginx containers"],
  ["Route", "Kubernetes Services and Ingress"],
];

export function ArchitectureSection() {
  return (
    <Section>
      <div className="mx-auto grid gap-12 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-7">
          <p className="text-xs font-semibold uppercase text-zinc-500">System Flow</p>
          <h2 className="text-4xl font-semibold leading-tight text-zinc-950 sm:text-5xl">
            A compact surface for explaining request flow, consistency, and rollout.
          </h2>
          <p className="max-w-2xl text-lg leading-8 text-zinc-600">
            The homepage mirrors the README narrative: stateless API access, transactional bid integrity, and Kubernetes-native deployment are treated as one system story.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            {["JWT API", "Row Locking", "OpenAPI"].map((item) => (
              <div key={item} className="border-t border-zinc-200 pt-4">
                <p className="text-sm font-medium text-zinc-950">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-6">
          <div className="rounded-[2rem] border border-zinc-200/70 bg-white p-7 shadow-soft">
            <p className="text-sm font-medium text-zinc-500">Runtime path</p>
            <ol className="mt-6 divide-y divide-zinc-100">
              {requestFlow.map(([label, detail], index) => (
                <li key={label} className="grid grid-cols-[2rem_1fr] gap-4 py-4 first:pt-0 last:pb-0">
                  <span className="text-sm font-semibold text-zinc-400">{index + 1}</span>
                  <div>
                    <p className="text-base font-semibold text-zinc-950">{label}</p>
                    <p className="mt-1 text-sm leading-6 text-zinc-500">{detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-[2rem] border border-zinc-200/70 bg-zinc-950 p-7 text-white shadow-soft">
            <p className="text-sm font-medium text-zinc-400">Deployment path</p>
            <ol className="mt-6 divide-y divide-white/10">
              {deployFlow.map(([label, detail], index) => (
                <li key={label} className="grid grid-cols-[2rem_1fr] gap-4 py-4 first:pt-0 last:pb-0">
                  <span className="text-sm font-semibold text-white/40">{index + 1}</span>
                  <div>
                    <p className="text-base font-semibold text-white">{label}</p>
                    <p className="mt-1 text-sm leading-6 text-zinc-400">{detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </Section>
  );
}
