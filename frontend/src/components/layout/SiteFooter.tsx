import { docsBaseUrl } from "../../lib/constants";

export function SiteFooter() {
  return (
    <footer className="border-t border-zinc-200/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 text-center text-sm text-zinc-500 lg:px-10">
        <p>A backend-focused auction system showcase built to explain architecture, bidding integrity, and deployment.</p>
        <div className="flex items-center justify-center gap-6">
          <a className="transition-opacity duration-300 ease-soft hover:opacity-60" href={`${docsBaseUrl}/api/docs/`} target="_blank" rel="noreferrer">
            API Docs
          </a>
          <a className="transition-opacity duration-300 ease-soft hover:opacity-60" href={`${docsBaseUrl}/api/schema/`} target="_blank" rel="noreferrer">
            OpenAPI
          </a>
        </div>
      </div>
    </footer>
  );
}
