import { Link } from "react-router-dom";
import { Button } from "../ui/Button";
import { Section } from "../ui/Section";

export function ShowcaseSection() {
  return (
    <Section className="bg-zinc-950 text-white">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-zinc-400">Interview Flow</p>
        <h2 className="text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
          Start with the story, then move into the live API demo.
        </h2>
        <p className="max-w-2xl text-lg leading-8 text-zinc-300">
          The landing page builds context. The demo page shows real product data and bid submission. The architecture page closes with infrastructure and deployment reasoning.
        </p>
        <Link to="/demo">
          <Button className="bg-white text-zinc-950 hover:opacity-90">Open Interactive Demo</Button>
        </Link>
      </div>
    </Section>
  );
}
