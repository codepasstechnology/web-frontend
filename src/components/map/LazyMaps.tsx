import { lazy, Suspense, type ComponentProps } from "react";

// Leaflet touches `window` as soon as it is imported, and the route tree
// imports every route module on the server. Loading the map components
// lazily keeps Leaflet out of server rendering.

const LandMapModule = lazy(() =>
  import("@/components/LandMap").then((m) => ({ default: m.LandMap })),
);
const LandBoundaryMapModule = lazy(() =>
  import("@/components/LandBoundaryMap").then((m) => ({ default: m.LandBoundaryMap })),
);
const MapSearchBarModule = lazy(() =>
  import("@/components/MapSearchBar").then((m) => ({ default: m.MapSearchBar })),
);
const GeoMiniMapModule = lazy(() =>
  import("@/components/GeoMiniMap").then((m) => ({ default: m.GeoMiniMap })),
);

export function LandMap(props: ComponentProps<typeof LandMapModule>) {
  return (
    <Suspense fallback={<div className="h-full w-full bg-muted" />}>
      <LandMapModule {...props} />
    </Suspense>
  );
}

export function LandBoundaryMap(props: ComponentProps<typeof LandBoundaryMapModule>) {
  return (
    <Suspense fallback={<div className="h-full w-full bg-muted" />}>
      <LandBoundaryMapModule {...props} />
    </Suspense>
  );
}

export function MapSearchBar(props: ComponentProps<typeof MapSearchBarModule>) {
  return (
    <Suspense fallback={null}>
      <MapSearchBarModule {...props} />
    </Suspense>
  );
}

export function GeoMiniMap(props: ComponentProps<typeof GeoMiniMapModule>) {
  return (
    <Suspense fallback={<div className="mt-4 h-40 rounded-md border border-border" />}>
      <GeoMiniMapModule {...props} />
    </Suspense>
  );
}
