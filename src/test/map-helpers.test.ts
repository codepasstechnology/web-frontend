import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  centroid,
  clusterByTouch,
  formatCoords,
  hasSelfIntersection,
  parseAcres,
  TOUCH_PX,
  zoomStepsToSeparate,
  type ScreenPoint,
} from "@/lib/mapGeo";
import { directionsUrl, streetViewUrl, whatsappShareUrl } from "@/lib/mapLinks";
import { clearRecent, pushRecent, readRecent } from "@/lib/recentlyViewed";
import { compareRows, distanceKm, isMixedDeal } from "@/lib/compare";
import { DEFAULT_FILTERS, matchesFilters } from "@/lib/parcelFilters";
import { plotStatus, sizeMismatch } from "@/lib/plotting";
import type { LandParcel } from "@/lib/landData";

const pt = (id: string, x: number, y: number): ScreenPoint => ({ id, x, y });
const ids = (groups: ScreenPoint[][]) => groups.map((g) => g.map((p) => p.id));

describe("clusterByTouch", () => {
  it("merges only markers that would touch on screen", () => {
    const groups = clusterByTouch([pt("a", 0, 0), pt("b", 30, 0), pt("c", 400, 0)]);
    expect(ids(groups)).toEqual([["a", "b"], ["c"]]);
  });

  it("keeps markers with room around them separate at any zoom", () => {
    const spread = [pt("a", 0, 0), pt("b", TOUCH_PX + 1, 0), pt("c", 0, TOUCH_PX + 1)];
    for (const scale of [1, 4, 64]) {
      const scaled = spread.map((p) => pt(p.id, p.x * scale, p.y * scale));
      expect(clusterByTouch(scaled)).toHaveLength(3);
    }
  });

  it("zooms in just far enough for a cluster's members to separate", () => {
    const members = [pt("a", 0, 0), pt("b", 10, 0), pt("c", 0, 20)];
    const steps = zoomStepsToSeparate(members);
    const scaled = members.map((p) => pt(p.id, p.x * 2 ** steps, p.y * 2 ** steps));

    expect(clusterByTouch(scaled)).toHaveLength(3);
    const tooFew = members.map((p) => pt(p.id, p.x * 2 ** (steps - 1), p.y * 2 ** (steps - 1)));
    expect(clusterByTouch(tooFew).length).toBeLessThan(3);
  });
});

describe("plot geometry", () => {
  const square = [
    { lat: -1, lng: 36 },
    { lat: -1, lng: 36.001 },
    { lat: -1.001, lng: 36.001 },
    { lat: -1.001, lng: 36 },
  ];
  const bowtie = [square[0], square[2], square[1], square[3]];

  it("spots a boundary that crosses itself", () => {
    expect(hasSelfIntersection(square)).toBe(false);
    expect(hasSelfIntersection(bowtie)).toBe(true);
  });

  it("checks an open draft without its closing edge", () => {
    // Two edges can't cross; the third (a diagonal) crosses the first.
    expect(hasSelfIntersection(bowtie.slice(0, 3), false)).toBe(false);
    expect(hasSelfIntersection([...bowtie, square[0]].slice(0, 5), false)).toBe(true);
  });

  it("puts the pin at the average of the corners", () => {
    expect(
      centroid([
        [0, 0],
        [0, 2],
        [2, 2],
        [2, 0],
      ]),
    ).toEqual([1, 1]);
  });

  it("reads the sizes sellers type", () => {
    expect(parseAcres("1/8 acre")).toBe(0.125);
    expect(parseAcres("2 acres")).toBe(2);
    expect(parseAcres("1 ha")).toBeCloseTo(2.471, 3);
    expect(parseAcres("50 x 100 ft")).toBeCloseTo(0.1148, 4);
    expect(parseAcres("—")).toBeNull();
  });

  it("formats coordinates with hemispheres", () => {
    expect(formatCoords(-1.49175, 36.98848)).toBe("1.49175° S, 36.98848° E");
  });
});

describe("outbound links", () => {
  it("builds the directions and Street View URLs", () => {
    expect(directionsUrl(-1.491751, 36.988482)).toBe(
      "https://www.google.com/maps/dir/?api=1&destination=-1.491751,36.988482",
    );
    expect(streetViewUrl(-1.491751, 36.988482)).toBe(
      "https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=-1.491751,36.988482",
    );
  });

  it("encodes the WhatsApp text, including the link's own query string", () => {
    const url = whatsappShareUrl(
      "1/8 acre plot, Kitengela (KAJ/KTG/4521) KES 1,450,000 https://x.test/land?parcel=4521&a=b",
    );
    expect(url.startsWith("https://wa.me/?text=")).toBe(true);
    expect(url).not.toContain(" ");
    expect(url).toContain("%2Fland%3Fparcel%3D4521%26a%3Db");
    expect(decodeURIComponent(url.slice("https://wa.me/?text=".length))).toContain(
      "(KAJ/KTG/4521) KES 1,450,000",
    );
  });
});

describe("recently viewed", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it("puts the newest first, without duplicates, and keeps six", () => {
    let list: string[] = [];
    for (const id of ["a", "b", "c", "a", "d", "e", "f", "g"]) list = pushRecent(list, id);

    expect(list).toEqual(["g", "f", "e", "d", "a", "c"]);
    expect(readRecent()).toEqual(list);
    clearRecent();
    expect(readRecent()).toEqual([]);
  });

  it("ignores junk in storage", () => {
    localStorage.setItem("gp_recent", '{"not":"a list"}');
    expect(readRecent()).toEqual([]);
    localStorage.setItem("gp_recent", "not json");
    expect(readRecent()).toEqual([]);
  });

  it("keeps working when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(readRecent()).toEqual([]);
    expect(pushRecent([], "a")).toEqual(["a"]);
    expect(() => clearRecent()).not.toThrow();
  });
});

const parcel = (over: Partial<LandParcel>): LandParcel =>
  ({
    id: "p",
    parcelNumber: "KAJ/1",
    size: "1 acre",
    price: 1_000_000,
    status: "available",
    listingType: "sale",
    postedBy: "owner",
    county: "Kajiado",
    amenities: { distanceToTarmac: "1 km", utilities: [] },
    ...over,
  }) as unknown as LandParcel;

describe("compare", () => {
  const cheap = parcel({
    id: "a",
    size: "2 acres",
    price: 2_000_000,
    amenities: { distanceToTarmac: "300 m", utilities: ["Water"] } as LandParcel["amenities"],
  });
  const near = parcel({
    id: "b",
    size: "1/2 acre",
    price: 1_500_000,
    amenities: {
      distanceToTarmac: "0.1 km",
      utilities: ["Water", "Electricity"],
    } as LandParcel["amenities"],
  });

  it("marks the best price per acre, nearest tarmac and most utilities", () => {
    const rows = compareRows([cheap, near]);
    const row = (label: string) => rows.find((r) => r.label === label)?.cells;

    expect(row("Price per acre")?.map((c) => c.best)).toEqual(["Lowest", undefined]);
    expect(row("Distance to tarmac")?.map((c) => c.best)).toEqual([undefined, "Nearest"]);
    expect(row("Utilities")?.map((c) => c.text)).toEqual(["1 of 2", "2 of 2"]);
    expect(row("Utilities")?.map((c) => c.best)).toEqual([undefined, "Most"]);
    expect(row("Electricity")?.map((c) => c.text)).toEqual(["—", "✓"]);
  });

  it("drops the price-per-acre badge when sale and lease are mixed", () => {
    const lease = { ...near, listingType: "lease" as const };
    expect(isMixedDeal([cheap, lease])).toBe(true);
    const rows = compareRows([cheap, lease]);
    expect(rows.find((r) => r.label === "Price per acre")?.cells.every((c) => !c.best)).toBe(true);
    expect(rows.find((r) => r.label === "Price per acre")?.cells[1].text).toMatch(/\/ yr$/);
  });

  it("reads tarmac distances in metres or kilometres", () => {
    expect(distanceKm("300 m")).toBe(0.3);
    expect(distanceKm("0 m (on tarmac)")).toBe(0);
    expect(distanceKm("1.2 km")).toBe(1.2);
    expect(distanceKm("—")).toBeNull();
  });
});

describe("land filters", () => {
  it("filters by verified or available, and has no sold status", () => {
    const verified = parcel({ status: "verified" });
    const available = parcel({ status: "available" });

    expect(matchesFilters(verified, { ...DEFAULT_FILTERS, status: "verified" })).toBe(true);
    expect(matchesFilters(available, { ...DEFAULT_FILTERS, status: "verified" })).toBe(false);
    expect(matchesFilters(available, DEFAULT_FILTERS)).toBe(true);
  });

  it("treats a zero price bound as no limit", () => {
    const p = parcel({ price: 50_000_000 });
    expect(matchesFilters(p, { ...DEFAULT_FILTERS, minPrice: 0, maxPrice: 0 })).toBe(true);
    expect(matchesFilters(p, { ...DEFAULT_FILTERS, maxPrice: 20_000_000 })).toBe(false);
  });
});

describe("plotting copy", () => {
  it("describes what has been placed", () => {
    expect(plotStatus(null, null)).toBe("Tap the map to drop a pin, or trace your boundary.");
    expect(plotStatus(null, null, true)).toBe("Tap the map to pin your property's location.");
    expect(plotStatus([-1.473141, 36.959781], null)).toBe("Pin set · -1.47314, 36.95978");
    expect(
      plotStatus(null, [
        { lat: -1, lng: 36 },
        { lat: -1, lng: 36.001 },
        { lat: -1.001, lng: 36.001 },
      ]),
    ).toMatch(/^Boundary traced · 3 points · ≈ \d/);
  });

  it("only flags sizes more than 40% apart", () => {
    expect(sizeMismatch(0.5, 0.5)).toBe(false);
    expect(sizeMismatch(0.69, 0.5)).toBe(false);
    expect(sizeMismatch(0.71, 0.5)).toBe(true);
    expect(sizeMismatch(0.29, 0.5)).toBe(true);
  });
});
