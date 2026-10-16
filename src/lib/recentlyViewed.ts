const KEY = "gp_recent";
const MAX = 6;

/** Listing ids the viewer opened, newest first. Never throws: storage can be blocked. */
export function readRecent(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string").slice(0, MAX)
      : [];
  } catch {
    return [];
  }
}

export function pushRecent(list: string[], id: string): string[] {
  const next = [id, ...list.filter((x) => x !== id)].slice(0, MAX);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable: keep the list for this visit only */
  }
  return next;
}

export function clearRecent(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* storage unavailable */
  }
}
