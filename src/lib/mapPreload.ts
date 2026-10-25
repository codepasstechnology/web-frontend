import { preconnectTiles } from "@/components/map/tiles";

let browse: Promise<unknown> | undefined;
let plotting: Promise<unknown> | undefined;

export function preloadMap(kind: "browse" | "plotting" = "browse") {
  if (typeof window === "undefined") return;
  preconnectTiles();
  if (kind === "plotting") {
    plotting ??= import("@/components/LandBoundaryMap").catch(() => {
      plotting = undefined;
    });
  } else {
    browse ??= import("@/components/LandMap").catch(() => {
      browse = undefined;
    });
  }
}
