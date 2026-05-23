import { docsBaseUrl } from "../../lib/constants";
import { useLanguage } from "../../i18n/LanguageContext";

function docsUrl(path: string) {
  return new URL(path, docsBaseUrl).toString();
}

export function SiteFooter() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-zinc-200/60 bg-white/80">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 text-center text-sm text-zinc-500 lg:px-10">
        <p>{t.footer.description}</p>
        <div className="flex items-center justify-center gap-6">
          <a className="rounded-full px-3 py-2 transition-colors transition-transform duration-300 ease-soft hover:bg-zinc-100 hover:text-zinc-950 active:scale-[0.96]" href={docsUrl("/api/docs/")} target="_blank" rel="noreferrer">
            {t.footer.apiDocs}
          </a>
          <a className="rounded-full px-3 py-2 transition-colors transition-transform duration-300 ease-soft hover:bg-zinc-100 hover:text-zinc-950 active:scale-[0.96]" href={docsUrl("/api/schema/")} target="_blank" rel="noreferrer">
            {t.footer.openApi}
          </a>
        </div>
      </div>
    </footer>
  );
}
