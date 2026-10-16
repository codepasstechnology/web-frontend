/** Listings whose prices share a scale and unit, so one slider fits them. */
export type PriceKind = "landSale" | "landLease" | "rent" | "homeSale" | "bnb";

export interface PriceRange {
  /** 0 means no limit on that side. */
  min: number;
  max: number;
}

export const ANY_PRICE: PriceRange = { min: 0, max: 0 };

/** Slider stops in KES per kind; the first is "no minimum" and the last "no maximum". */
export const PRICE_SCALES: Record<PriceKind, { stops: number[]; unit: string }> = {
  landSale: {
    stops: [
      0, 250_000, 500_000, 1_000_000, 2_000_000, 3_000_000, 5_000_000, 10_000_000, 20_000_000,
      50_000_000, 100_000_000,
    ],
    unit: "",
  },
  landLease: {
    stops: [0, 10_000, 20_000, 50_000, 100_000, 200_000, 500_000, 1_000_000, 2_000_000],
    unit: " / yr",
  },
  rent: {
    stops: [
      0, 5_000, 10_000, 15_000, 20_000, 30_000, 50_000, 75_000, 100_000, 150_000, 250_000, 500_000,
    ],
    unit: " / mo",
  },
  homeSale: {
    stops: [
      0, 1_000_000, 2_000_000, 3_000_000, 5_000_000, 8_000_000, 10_000_000, 15_000_000, 20_000_000,
      30_000_000, 50_000_000, 100_000_000,
    ],
    unit: "",
  },
  bnb: {
    stops: [0, 1_000, 2_000, 3_000, 5_000, 8_000, 10_000, 15_000, 20_000, 30_000, 50_000],
    unit: " / night",
  },
};

export const LAND_PRICE_KIND = { sale: "landSale", lease: "landLease" } as const;
export const HOME_PRICE_KIND = { rent: "rent", sale: "homeSale", bnb: "bnb" } as const;

export function inRange(price: number, r: PriceRange): boolean {
  return (!r.min || price >= r.min) && (!r.max || price <= r.max);
}
