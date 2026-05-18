export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "";
export const docsBaseUrl = import.meta.env.VITE_DOCS_BASE_URL ?? "http://127.0.0.1:8000";

export const showcaseStats = [
  { label: "api", value: "Stateless JWT" },
  { label: "consistency", value: "PostgreSQL locks" },
  { label: "runtime", value: "Docker + Kubernetes" },
];
