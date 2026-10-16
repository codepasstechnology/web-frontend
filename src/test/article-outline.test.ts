import { describe, it, expect } from "vitest";
import { articleOutline } from "@/lib/articleOutline";

describe("articleOutline", () => {
  it("ids every h2 and lists them in order", () => {
    const { html, outline } = articleOutline(
      "<p>Intro</p><h2>1. Start with the map</h2><p>…</p><h2>Check <strong>title</strong> details</h2>",
    );

    expect(outline).toEqual([
      { id: "1-start-with-the-map", label: "1. Start with the map" },
      { id: "check-title-details", label: "Check title details" },
    ]);
    expect(html).toContain('<h2 id="1-start-with-the-map">1. Start with the map</h2>');
    expect(html).toContain(
      '<h2 id="check-title-details">Check <strong>title</strong> details</h2>',
    );
  });

  it("decodes entities in labels, replaces stray attributes and keeps ids unique", () => {
    const { html, outline } = articleOutline(
      '<h2 class="x" id="old">Q&amp;A</h2><h2>Q &amp; A</h2><h2>!!!</h2>',
    );

    expect(outline.map((o) => o.label)).toEqual(["Q&A", "Q & A", "!!!"]);
    expect(outline.map((o) => o.id)).toEqual(["q-a", "q-a-2", "section"]);
    expect(html).not.toContain('class="x"');
  });

  it("leaves other headings alone", () => {
    const source = "<h3>Small</h3><p>Body</p>";
    expect(articleOutline(source)).toEqual({ html: source, outline: [] });
  });
});
