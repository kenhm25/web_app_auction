import { NavLink } from "react-router-dom";

const navItems = [
  { label: "Overview", to: "/" },
  { label: "Demo", to: "/demo" },
  { label: "Race Demo", to: "/race-condition" },
  { label: "Architecture", to: "/architecture" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200/60 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 lg:px-10">
        <NavLink className="text-sm font-semibold tracking-[0.24em] text-zinc-950" to="/">
          AUCTION SYSTEM
        </NavLink>
        <nav className="flex items-center gap-6 text-sm text-zinc-500">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  "transition-opacity duration-300 ease-soft hover:opacity-70",
                  isActive ? "text-zinc-950" : "text-zinc-500",
                ].join(" ")
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
