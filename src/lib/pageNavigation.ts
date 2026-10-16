/** A full page load, so the app starts fresh (used to enter and leave maintenance). */
export function loadPage(url: string, replace = false): void {
  if (replace) window.location.replace(url);
  else window.location.assign(url);
}
