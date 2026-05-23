import { NavLink } from "react-router-dom";
import { type Language, useLanguage } from "../../i18n/LanguageContext";

const navItems = [
  { key: "overview", to: "/" },
  { key: "auth", to: "/demo/auth" },
  { key: "auction", to: "/demo/app" },
  { key: "race", to: "/race-condition" },
] as const;

const languageOptions: Array<{ value: Language; labelKey: "english" | "chinese" }> = [
  { value: "en", labelKey: "english" },
  { value: "zh", labelKey: "chinese" },
];

export function SiteHeader() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200/60 bg-white/85 shadow-[0_1px_0_rgba(24,24,27,0.03)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-4 lg:px-10">
        <NavLink
          className="text-sm font-semibold tracking-[0.24em] text-zinc-950 transition-colors duration-300 ease-soft hover:text-blue-700"
          to="/"
        >
          {t.header.brand}
        </NavLink>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <nav className="flex flex-wrap items-center gap-x-2 gap-y-2 text-sm text-zinc-500 sm:justify-start">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    "rounded-full px-3 py-2 transition-colors transition-transform duration-300 ease-soft active:scale-[0.96]",
                    isActive
                      ? "bg-zinc-950 text-white shadow-sm"
                      : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950",
                  ].join(" ")
                }
              >
                {t.header.nav[item.key]}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2 self-start rounded-full border border-zinc-200 bg-white p-1.5 shadow-sm sm:self-auto">
            <span className="px-2 text-xs font-medium uppercase tracking-[0.18em] text-zinc-400">
              {t.header.language}
            </span>
            {languageOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setLanguage(option.value)}
                className={[
                  "min-h-10 rounded-full px-3 text-sm font-medium transition-colors transition-transform duration-300 ease-soft active:scale-[0.96]",
                  language === option.value
                    ? "bg-zinc-950 text-white shadow-sm"
                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950",
                ].join(" ")}
                aria-pressed={language === option.value}
              >
                {t.header[option.labelKey]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
