import { describe, it, expect, vi, afterEach } from "vitest";
import { Route } from "@/routes/__root";

type Head = {
  meta: Record<string, string>[];
  links: Record<string, string>[];
};

const head = () => (Route.options.head as unknown as () => Head)();
const meta = (h: Head, key: string) =>
  h.meta.find((m) => m.property === key || m.name === key)?.content;

describe("Root head — icons and link-share preview", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("points the share image at the public site origin", () => {
    vi.stubEnv("VITE_SITE_URL", "https://geopin.example");
    const h = head();
    expect(meta(h, "og:image")).toBe("https://geopin.example/og-image.png");
    expect(meta(h, "twitter:image")).toBe("https://geopin.example/og-image.png");
    expect(meta(h, "twitter:card")).toBe("summary_large_image");
    expect(meta(h, "og:site_name")).toBe("Geo Pin Properties");
  });

  it("links the favicon, touch icon and manifest", () => {
    const hrefs = head().links.map((l) => `${l.rel} ${l.href}`);
    expect(hrefs).toEqual(
      expect.arrayContaining([
        "icon /favicon.ico",
        "icon /favicon.svg",
        "apple-touch-icon /apple-touch-icon.png",
        "manifest /site.webmanifest",
      ]),
    );
  });
});
