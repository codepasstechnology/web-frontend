import { loadPage } from "@/lib/pageNavigation";

/** Pages that keep working while the site is down for maintenance. */
export const ALWAYS_OPEN_PATHS = new Set(["/maintenance", "/help", "/contact"]);

/** Only same-site paths, so `?from=` can't send anyone to another site. */
export function safeReturnPath(from: string | undefined): string {
  return from && from.startsWith("/") && !from.startsWith("//") ? from : "/";
}

export function goToMaintenance(): void {
  if (typeof window === "undefined") return;
  const { pathname, search } = window.location;
  if (ALWAYS_OPEN_PATHS.has(pathname)) return;
  loadPage(`/maintenance?from=${encodeURIComponent(pathname + search)}`);
}
