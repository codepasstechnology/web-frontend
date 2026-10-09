import type { LandParcel } from "./landData";
import { parseAcres } from "./mapGeo";

export const COMPARE_MAX = 3;

export interface CompareCell {
  text: string;
  best?: string;
}

export interface CompareRow {
  label: string;
  cells: CompareCell[];
  strong?: boolean;
  sub?: boolean;
}

const kes = (n: number) => `KES ${Math.round(n).toLocaleString("en-US")}`;

/** "300 m", "0.4 km", "0 m (on tarmac)" → km; null when unknown. */
export function distanceKm(text: string): number | null {
  const m = text.toLowerCase().match(/(\d+(?:\.\d+)?)\s*(km|m)\b/);
  if (!m) return null;
  return m[2] === "km" ? Number(m[1]) : Number(m[1]) / 1000;
}

/** True when sale and lease are mixed, so price per acre can't be compared. */
export function isMixedDeal(parcels: LandParcel[]): boolean {
  return new Set(parcels.map((p) => p.listingType)).size > 1;
}

function bestOf(values: (number | null)[], pick: "min" | "max"): number | null {
  const known = values.filter((v): v is number => v !== null);
  if (values.length < 2 || known.length === 0) return null;
  return pick === "min" ? Math.min(...known) : Math.max(...known);
}

export function compareRows(parcels: LandParcel[]): CompareRow[] {
  const mixed = isMixedDeal(parcels);
  const perYear = (p: LandParcel) => (p.listingType === "lease" ? " / yr" : "");
  const acres = parcels.map((p) => parseAcres(p.size));
  const ppa = parcels.map((p, i) => (acres[i] ? p.price / (acres[i] as number) : null));
  const tarmac = parcels.map((p) => distanceKm(p.amenities.distanceToTarmac));
  const utilities = [...new Set(parcels.flatMap((p) => p.amenities.utilities))];

  const bestPpa = mixed ? null : bestOf(ppa, "min");
  const bestTarmac = bestOf(tarmac, "min");
  const bestUtil = utilities.length
    ? bestOf(
        parcels.map((p) => p.amenities.utilities.length),
        "max",
      )
    : null;

  return [
    { label: "Price", cells: parcels.map((p) => ({ text: kes(p.price) + perYear(p) })) },
    {
      label: "Size",
      cells: parcels.map((p, i) => ({
        text:
          p.size +
          (acres[i] !== null && !/acre/i.test(p.size)
            ? ` (≈ ${(acres[i] as number).toFixed(2)} ac)`
            : ""),
      })),
    },
    {
      label: "Price per acre",
      strong: true,
      cells: parcels.map((p, i) => ({
        text: ppa[i] === null ? "—" : kes(ppa[i] as number) + perYear(p),
        best: bestPpa !== null && ppa[i] === bestPpa ? "Lowest" : undefined,
      })),
    },
    {
      label: "Distance to tarmac",
      cells: parcels.map((p, i) => ({
        text: p.amenities.distanceToTarmac,
        best: bestTarmac !== null && tarmac[i] === bestTarmac ? "Nearest" : undefined,
      })),
    },
    {
      label: "Verified",
      cells: parcels.map((p) => ({ text: p.status === "verified" ? "✓ Verified" : "Not yet" })),
    },
    {
      label: "Boundary",
      cells: parcels.map((p) => ({ text: p.polygon ? "Traced" : "Approximate pin" })),
    },
    { label: "Land use", cells: parcels.map((p) => ({ text: p.landUse || "—" })) },
    {
      label: "Posted by",
      cells: parcels.map((p) => ({ text: p.postedBy === "owner" ? "Owner" : "Broker" })),
    },
    {
      label: "Utilities",
      cells: parcels.map((p) => ({
        text: `${p.amenities.utilities.length} of ${utilities.length}`,
        best: bestUtil !== null && p.amenities.utilities.length === bestUtil ? "Most" : undefined,
      })),
    },
    ...utilities.map((u): CompareRow => ({
      label: u,
      sub: true,
      cells: parcels.map((p) => ({ text: p.amenities.utilities.includes(u) ? "✓" : "—" })),
    })),
  ];
}
