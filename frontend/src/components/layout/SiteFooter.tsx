import { useLanguage } from "../../i18n/LanguageContext";

const footerLinkClass =
  "inline-flex items-center gap-2 rounded-full px-3 py-2 transition-colors transition-transform duration-300 ease-soft hover:bg-zinc-100 hover:text-zinc-950 active:scale-[0.96]";

function GitHubIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4 shrink-0"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        fillRule="evenodd"
        d="M12 .5C5.65.5.5 5.65.5 12c0 5.09 3.29 9.4 7.86 10.92.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18A11.1 11.1 0 0 1 12 5.49c.98 0 1.95.13 2.87.39 2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.42-2.69 5.39-5.25 5.68.41.35.78 1.05.78 2.12 0 1.53-.01 2.77-.01 3.15 0 .31.21.67.79.56A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4 shrink-0"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M20.45 20.45h-3.56v-5.58c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.95v5.67H9.34V8.98h3.42v1.57h.05a3.75 3.75 0 0 1 3.37-1.85c3.61 0 4.28 2.38 4.28 5.47v6.28ZM5.32 7.42a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12Zm1.78 13.03H3.54V8.98H7.1v11.47ZM22.23 0H1.76C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.76 24h20.47c.97 0 1.77-.77 1.77-1.72V1.72C24 .77 23.2 0 22.23 0Z" />
    </svg>
  );
}



export function SiteFooter() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-zinc-200/60 bg-white/80">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 text-center text-sm text-zinc-500 lg:px-10">
        <p>{t.footer.description}</p>
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6">
          <a className={footerLinkClass} href="/api/docs/" target="_blank" rel="noreferrer">
            {t.footer.apiDocs}
          </a>
          <a className={footerLinkClass} href="/api/redoc/" target="_blank" rel="noreferrer">
            {t.footer.openApi}
          </a>
          {/* <a className={footerLinkClass} href="https://www.linkedin.com/in/kenhu25" target="_blank" rel="noreferrer">
            <LinkedInIcon />
            LinkedIn
          </a> */}
          <a className={footerLinkClass} href="https://github.com/kenhm25/web_app_auction" target="_blank" rel="noreferrer">
            <GitHubIcon />
            GitHub Repository
          </a>
        </div>
      </div>
    </footer>
  );
}
