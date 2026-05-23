import { NavLink } from "react-router-dom";

const navItems = [
  { label: "Overview", to: "/" },
  { label: "Auth Showcase", to: "/demo/auth" },
  { label: "Auction App", to: "/demo/app" },
  { label: "Race Condition Demo", to: "/race-condition" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200/60 bg-white/85 shadow-[0_1px_0_rgba(24,24,27,0.03)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-10">
        <NavLink className="text-sm font-semibold tracking-[0.24em] text-zinc-950 transition-colors duration-300 ease-soft hover:text-blue-700" to="/">
          AUCTION SYSTEM
        </NavLink>
        <nav className="flex flex-wrap items-center gap-x-2 gap-y-2 text-sm text-zinc-500 sm:justify-end">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  "rounded-full px-3 py-2 transition-colors duration-300 ease-soft active:scale-[0.96]",
                  isActive ? "bg-zinc-950 text-white shadow-sm" : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950",
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
