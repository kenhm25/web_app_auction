import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary";
  }
>;

export function Button({
  children,
  variant = "primary",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        "inline-flex min-h-10 items-center justify-center rounded-full px-6 py-3 text-sm font-medium shadow-sm transition-colors transition-transform duration-300 ease-soft active:scale-[0.96] disabled:pointer-events-none disabled:opacity-60",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950/20",
        variant === "primary"
          ? "bg-zinc-950 text-white hover:bg-zinc-800"
          : "border border-zinc-200 bg-white text-zinc-950 hover:border-zinc-300 hover:bg-zinc-50",
        className ?? "",
      ].join(" ")}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}
