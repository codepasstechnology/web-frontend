import { polygonAreaAcres, type LatLng } from "./mapGeo";

export interface PlotColors {
  boundary: string;
  retrace: string;
  error: string;
}

/** Plotting lines must stay visible on imagery, so their colours follow the basemap. */
export function plotColors(satellite: boolean, dark: boolean): PlotColors {
  if (satellite) return { boundary: "#C6F07E", retrace: "#FFB547", error: "#FF7A6B" };
  return dark
    ? { boundary: "#A9C97A", retrace: "#EDB660", error: "#F2877E" }
    : { boundary: "#3F5A2A", retrace: "#C26A12", error: "#B3261E" };
}

/** "0.125" for small plots, "2.40" otherwise. */
export function formatAcres(acres: number): string {
  return acres < 0.1 ? acres.toFixed(3) : acres.toFixed(2);
}

export function plotStatus(
  pin: [number, number] | null,
  boundary: LatLng[] | null,
  pinOnly = false,
): string {
  if (boundary) {
    return `Boundary traced · ${boundary.length} points · ≈ ${formatAcres(polygonAreaAcres(boundary))} acres`;
  }
  if (pin) return `Pin set · ${pin[0].toFixed(5)}, ${pin[1].toFixed(5)}`;
  return pinOnly
    ? "Tap the map to pin your property's location."
    : "Tap the map to drop a pin, or trace your boundary.";
}

/** The traced shape and the size typed in step 1 disagree by more than 40 %. */
export function sizeMismatch(tracedAcres: number, typedAcres: number): boolean {
  if (typedAcres <= 0) return false;
  const ratio = tracedAcres / typedAcres;
  return ratio > 1.4 || ratio < 0.6;
}
