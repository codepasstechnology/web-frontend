import type { AgencyListingItem, AgencyTab } from "@/lib/agency";

export interface ListingFilters {
  type: string;
  county: string;
  maxPrice: number;
  project: string;
  beds: number;
}

export const NO_FILTERS: ListingFilters = {
  type: "",
  county: "",
  maxPrice: 0,
  project: "",
  beds: 0,
};

export function inTab(l: AgencyListingItem, tab: AgencyTab): boolean {
  if (tab === "all" || tab === "closed") return true;
  if (tab === "land") return l.kind === "parcel";
  return l.kind === "property" && l.item.intent === tab;
}

export function applyFilters(items: AgencyListingItem[], f: ListingFilters): AgencyListingItem[] {
  return items.filter((l) => {
    if ((f.type || f.beds) && l.kind === "parcel") return false;
    if (f.type && l.kind === "property" && l.item.type !== f.type) return false;
    if (f.beds && l.kind === "property" && l.item.bedrooms < f.beds) return false;
    if (f.county && l.item.county !== f.county) return false;
    if (f.maxPrice && l.item.price > f.maxPrice) return false;
    if (f.project && l.item.project !== f.project) return false;
    return true;
  });
}
