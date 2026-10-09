import type { LandParcel, LandStatus, ListingType, PostedBy } from "./landData";

export interface Filters {
  query: string;
  county: string;
  /** Only verified and available parcels are ever public, so there is no "sold". */
  status: Extract<LandStatus, "verified" | "available"> | "all";
  listingType: ListingType | "all";
  postedBy: PostedBy | "all";
  /** 0 means no limit. */
  minPrice: number;
  maxPrice: number;
}

export const DEFAULT_FILTERS: Filters = {
  query: "",
  county: "All",
  status: "all",
  listingType: "all",
  postedBy: "all",
  minPrice: 0,
  maxPrice: 0,
};

export function matchesFilters(p: LandParcel, f: Filters): boolean {
  const q = f.query.trim().toLowerCase();
  return (
    (q === "" || p.parcelNumber.toLowerCase().includes(q)) &&
    (f.county === "All" || p.county === f.county) &&
    (f.status === "all" || p.status === f.status) &&
    (f.listingType === "all" || p.listingType === f.listingType) &&
    (f.postedBy === "all" || p.postedBy === f.postedBy) &&
    (!f.minPrice || p.price >= f.minPrice) &&
    (!f.maxPrice || p.price <= f.maxPrice)
  );
}

export function filtersActive(f: Filters): boolean {
  return (Object.keys(DEFAULT_FILTERS) as (keyof Filters)[]).some(
    (k) => f[k] !== DEFAULT_FILTERS[k],
  );
}

/** "KES 1,450,000", or "KES 180,000 / yr" for a lease. */
export function parcelPrice(p: Pick<LandParcel, "price" | "listingType">): string {
  return `KES ${p.price.toLocaleString("en-US")}${p.listingType === "lease" ? " / yr" : ""}`;
}
