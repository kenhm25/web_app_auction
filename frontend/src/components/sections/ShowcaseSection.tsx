import { Link } from "react-router-dom";
import { Button } from "../ui/Button";
import { Section } from "../ui/Section";

export function ShowcaseSection() {
  return (
    <Section className="bg-zinc-950 text-white">
      <div className="grid items-center gap-10 lg:grid-cols-[1fr_0.75fr]">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase text-zinc-400">Review Flow</p>
          <h2 className="mt-6 text-4xl font-semibold leading-tight sm:text-5xl">
            Move from architecture narrative to live API behavior.
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">
            Start with the system overview, inspect the JWT-backed auction demo, then use the race-condition visualization to discuss transaction safety under concurrent writes.
          </p>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row lg:flex-col">
          <Link to="/demo">
            <Button className="w-full bg-white text-zinc-950 hover:opacity-90">Open API Demo</Button>
          </Link>
          <Link to="/architecture">
            <Button variant="secondary" className="w-full border-white/20 bg-white/10 text-white hover:bg-white/15">
              View Architecture
            </Button>
          </Link>
        </div>
      </div>
    </Section>
  );
}
