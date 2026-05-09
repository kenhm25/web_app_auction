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
        "inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-medium transition-all duration-300 ease-soft",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950/20",
        variant === "primary"
          ? "bg-zinc-950 text-white hover:opacity-90"
          : "border border-zinc-200 bg-white text-zinc-950 hover:bg-zinc-50",
        className ?? "",
      ].join(" ")}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}
