import type { PropsWithChildren } from "react";
import { useReveal } from "../../hooks/useReveal";

type SectionProps = PropsWithChildren<{
  className?: string;
  containerClassName?: string;
  id?: string;
}>;

export function Section({ children, className, containerClassName, id }: SectionProps) {
  const ref = useReveal<HTMLDivElement>();

  return (
    <section id={id} className={["w-full px-6 py-24 sm:py-28 lg:px-10 lg:py-36", className ?? ""].join(" ")}>
      <div ref={ref} className={["reveal mx-auto max-w-6xl", containerClassName ?? ""].join(" ")}>
        {children}
      </div>
    </section>
  );
}
