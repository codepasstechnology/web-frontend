export interface OutlineEntry {
  id: string;
  label: string;
}

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  "#39": "'",
  nbsp: " ",
};

function textOf(html: string) {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (_, name: string) => ENTITIES[name])
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Gives every h2 in an article body a stable, unique id and lists them for the
 * table of contents. Works on the HTML string (not the DOM) so the server and
 * the browser render identical markup.
 */
export function articleOutline(html: string): { html: string; outline: OutlineEntry[] } {
  const outline: OutlineEntry[] = [];
  const used = new Set<string>();

  const withIds = html.replace(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi, (_, inner: string) => {
    const label = textOf(inner);
    const base =
      label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "section";
    let id = base;
    for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
    used.add(id);
    outline.push({ id, label });
    return `<h2 id="${id}">${inner}</h2>`;
  });

  return { html: withIds, outline };
}
