import { describe, it, expect, beforeEach, vi } from "vitest";

const mockPost = vi.fn<(path: string, body: Record<string, unknown>) => Promise<unknown>>(() =>
  Promise.resolve(),
);
vi.mock("@/lib/api", () => ({ api: { post: mockPost } }));

/** Each import is a fresh page load; localStorage carries over like in a real browser. */
const loadPage = async (url: string, referrer = "") => {
  window.history.replaceState({}, "", url);
  Object.defineProperty(document, "referrer", { value: referrer, configurable: true });
  vi.resetModules();
  return import("@/lib/traffic");
};

const lastVisit = () => mockPost.mock.calls.at(-1)?.[1] ?? {};

const saveChoice = (choice: "all" | "essential") =>
  localStorage.setItem(
    "gp_cookie_consent",
    JSON.stringify({ choice, at: Date.now(), version: "1.0", id: crypto.randomUUID() }),
  );

beforeEach(() => {
  localStorage.clear();
  saveChoice("all");
  mockPost.mockClear();
});

describe("trackPageView", () => {
  it("only adds to anonymous totals until analytics cookies are accepted", async () => {
    localStorage.removeItem("gp_cookie_consent");
    const t = await loadPage("/land?s=Ab12Cd34Ef", "https://l.facebook.com/");
    t.trackPageView("/land", 0);
    t.trackPageView("/pricing", 1_000);
    saveChoice("essential");
    (await loadPage("/", `${window.location.origin}/land`)).trackPageView("/", 0);

    expect(mockPost.mock.calls).toEqual([
      ["/traffic/anonymous", { visit: true }],
      ["/traffic/anonymous", { visit: false }],
      ["/traffic/anonymous", { visit: false }],
    ]);
    expect(localStorage.getItem("gp_visitor")).toBeNull();
    expect(localStorage.getItem("gp_session")).toBeNull();
  });

  it("sends where the visit came from on its first page only", async () => {
    const t = await loadPage(
      "/land?parcel=abc&s=Ab12Cd34Ef&utm_source=wa&utm_campaign=oct",
      "https://l.facebook.com/",
    );
    t.trackPageView("/land", 1_000);
    const first = lastVisit();
    expect(first).toMatchObject({
      path: "/land",
      entry: true,
      referrer: "https://l.facebook.com/",
      share: "Ab12Cd34Ef",
      utm_source: "wa",
      utm_campaign: "oct",
    });

    t.trackPageView("/pricing", 60_000);
    const second = lastVisit();
    expect(second).toMatchObject({ path: "/pricing", entry: false });
    expect(second).not.toHaveProperty("share");
    expect(second.session_id).toBe(first.session_id);
    expect(second.visitor_id).toBe(first.visitor_id);
    expect(mockPost).toHaveBeenCalledWith("/traffic/visit", expect.anything());
  });

  it("starts a new visit after 30 idle minutes but keeps the same visitor", async () => {
    const t = await loadPage("/");
    t.trackPageView("/", 0);
    const first = lastVisit();

    t.trackPageView("/land", 31 * 60 * 1000);
    const later = lastVisit();
    expect(later.entry).toBe(true);
    expect(later.session_id).not.toBe(first.session_id);
    expect(later.visitor_id).toBe(first.visitor_id);
  });

  it("credits a shared link opened in the middle of a visit", async () => {
    (await loadPage("/")).trackPageView("/", 0);
    const before = lastVisit();

    (await loadPage("/land?parcel=abc&s=Zz98Yy76Xx")).trackPageView("/land", 5_000);
    const shared = lastVisit();
    expect(shared).toMatchObject({ entry: true, share: "Zz98Yy76Xx", referrer: null });
    expect(shared.session_id).not.toBe(before.session_id);
    expect(shared.visitor_id).toBe(before.visitor_id);
  });

  it("does not treat links within our own site as a referrer", async () => {
    const t = await loadPage("/", `${window.location.origin}/pricing`);
    t.trackPageView("/", 0);
    expect(lastVisit()).toMatchObject({ entry: true, referrer: null });
  });
});

describe("share links", () => {
  it("tags the link and records who shared which listing", async () => {
    const t = await loadPage("/");
    const code = t.newShareCode();
    expect(code).toMatch(/^[A-Za-z0-9]{10}$/);
    expect(t.withShareCode("https://x.test/land?parcel=1", code)).toBe(
      `https://x.test/land?parcel=1&s=${code}`,
    );
    expect(t.withShareCode("https://x.test/about", code)).toBe(`https://x.test/about?s=${code}`);

    t.recordShare(code, { type: "parcel", id: "p-1" }, "whatsapp");
    expect(mockPost).toHaveBeenCalledWith("/traffic/share", {
      code,
      listing_type: "parcel",
      listing_id: "p-1",
      channel: "whatsapp",
      visitor_id: null,
    });
  });
});
