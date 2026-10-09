import { useEffect, useMemo, useRef, useState } from "react";
import {
  Circle,
  MapContainer,
  Marker,
  Polygon,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
  ZoomControl,
} from "react-leaflet";
import L from "leaflet";
import { Plus } from "lucide-react";
import type { LandParcel } from "@/lib/landData";
import { parcelPrice } from "@/lib/parcelFilters";
import { formatPrice, INTENT_LABELS, type Property } from "@/lib/properties";
import {
  centroid,
  clusterByTouch,
  zoomStepsToSeparate,
  type Bbox,
  type ScreenPoint,
} from "@/lib/mapGeo";
import { MapSatelliteToggle, MapSearchBar } from "@/components/MapSearchBar";
import {
  SATELLITE_ATTRIBUTION,
  SATELLITE_TILES,
  DARK_TILES_CLASS,
  STREET_ATTRIBUTION,
  STREET_TILES,
  useIsDark,
} from "@/components/map/tiles";
import { MapLegend } from "@/components/MapLegend";
import {
  beaconIcon,
  clusterIcon,
  DEAL_COLOR,
  DEAL_TAG,
  INTENT_COLOR,
  meIcon,
  parcelLabelIcon,
  propertyIcon,
  propertyKind,
  propertyShortLabel,
} from "@/components/map/markers";
import "@/components/map/map.css";

export interface FlyTarget {
  lat: number;
  lng: number;
  zoom?: number;
}

function FlyToTarget({ target }: { target: FlyTarget | null }) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    map.flyTo([target.lat, target.lng], target.zoom ?? 14, { duration: 1.2 });
  }, [map, target]);
  return null;
}

export type MapMode = "land" | "rentals" | "all";

interface Props {
  mode: MapMode;
  onSelectParcel?: (p: LandParcel | null) => void;
  onSelectProperty?: (p: Property | null) => void;
  selectedId?: string | null;
  parcels?: LandParcel[];
  properties?: Property[];
  flyTarget?: FlyTarget | null;
  /** Listings to highlight, e.g. while their sidebar card is hovered. */
  hotIds?: string[];
  onHover?: (ids: string[]) => void;
  /** Recently viewed listings get a small grey dot. */
  seenIds?: string[];
  /** Fired after the map settles, so the page can load just the visible area. */
  onBoundsChange?: (bbox: Bbox) => void;
  areaLoading?: boolean;
  loadError?: boolean;
  retrying?: boolean;
  onRetry?: () => void;
}

/** Below this zoom a plot is only a few pixels wide, so its corner beacons are hidden. */
const BEACON_MIN_ZOOM = 15;

const isMobileWidth = () => window.innerWidth <= 900;

// Fits map to all parcels/properties on first load, and zooms to the
// selected one when chosen.
function MapController({
  mode,
  selectedId,
  parcels,
  properties,
}: {
  mode: MapMode;
  selectedId?: string | null;
  parcels: LandParcel[];
  properties: Property[];
}) {
  const map = useMap();
  const fitted = useRef(false);
  const flownTo = useRef<string | null>(null);
  useEffect(() => {
    if (fitted.current) return;
    const all = [
      ...(mode === "rentals"
        ? []
        : parcels.flatMap(
            (p) =>
              p.polygon ??
              (p.latitude != null && p.longitude != null
                ? [[p.latitude, p.longitude] as [number, number]]
                : []),
          )),
      ...(mode === "land" ? [] : properties.map((p) => p.position)),
    ];
    if (all.length === 0) return;
    fitted.current = true;
    map.fitBounds(all as L.LatLngBoundsLiteral, { padding: [40, 40] });
  }, [map, mode, parcels, properties]);
  useEffect(() => {
    if (!selectedId) {
      flownTo.current = null;
      return;
    }
    // Refetched data must not yank the map back to a listing already shown.
    if (flownTo.current === selectedId) return;

    let bounds: [number, number][] | null = null;
    const parcel = mode === "rentals" ? undefined : parcels.find((x) => x.id === selectedId);
    const property = mode === "land" ? undefined : properties.find((x) => x.id === selectedId);
    if (parcel) {
      bounds =
        parcel.polygon ??
        (parcel.latitude != null && parcel.longitude != null
          ? [
              [parcel.latitude, parcel.longitude],
              [parcel.latitude, parcel.longitude],
            ]
          : null);
    } else if (property) {
      bounds = [property.position, property.position];
    }
    if (!bounds) return;
    flownTo.current = selectedId;

    // The listing panel covers the right side of the map on desktop and the
    // bottom ~60% on mobile — pad the fly-to so the parcel lands in the
    // slice of map that's actually still visible, not hidden behind it.
    const paddingBottomRight: [number, number] = isMobileWidth()
      ? [20, window.innerHeight * 0.58]
      : [400, 20];

    map.flyToBounds(bounds as L.LatLngBoundsLiteral, {
      paddingTopLeft: [20, 20],
      paddingBottomRight,
      maxZoom: 17,
      duration: 1,
    });
  }, [map, mode, selectedId, parcels, properties]);
  return null;
}

function BoundsWatcher({ onChange }: { onChange?: (bbox: Bbox) => void }) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  useEffect(() => () => clearTimeout(timer.current ?? undefined), []);
  useMapEvents({
    moveend(e) {
      if (!onChangeRef.current) return;
      const b = (e.target as L.Map).getBounds();
      clearTimeout(timer.current ?? undefined);
      timer.current = setTimeout(
        () => onChangeRef.current?.([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]),
        300,
      );
    },
  });
  return null;
}

type Item =
  | { kind: "parcel"; id: string; at: [number, number]; place: string; parcel: LandParcel }
  | { kind: "property"; id: string; at: [number, number]; place: string; property: Property };

const SEGMENT_ORDER = ["lsale", "llease", "rent", "sale", "bnb"] as const;
const SEGMENT_COLOR: Record<(typeof SEGMENT_ORDER)[number], string> = {
  lsale: DEAL_COLOR.sale,
  llease: DEAL_COLOR.lease,
  rent: INTENT_COLOR.rent,
  sale: INTENT_COLOR.sale,
  bnb: INTENT_COLOR.bnb,
};
const segmentOf = (it: Item): (typeof SEGMENT_ORDER)[number] =>
  it.kind === "parcel"
    ? it.parcel.listingType === "lease"
      ? "llease"
      : "lsale"
    : it.property.intent;

function parcelAria(p: LandParcel): string {
  return [
    `${DEAL_TAG[p.listingType]}: ${p.parcelNumber}`,
    p.size,
    p.area || p.county,
    p.status === "verified" ? "verified" : "not yet verified",
    p.polygon ? "" : "approximate location",
  ]
    .filter(Boolean)
    .join(", ");
}

function ParcelShape({
  parcel,
  at,
  on,
  seen,
  showBeacons,
  index,
  onSelect,
  onHover,
}: {
  parcel: LandParcel;
  at: [number, number];
  on: boolean;
  seen: boolean;
  showBeacons: boolean;
  index: number;
  onSelect: () => void;
  onHover: (ids: string[]) => void;
}) {
  const color = DEAL_COLOR[parcel.listingType];
  const verified = parcel.status === "verified";
  const handlers = {
    click: onSelect,
    mouseover: () => onHover([parcel.id]),
    mouseout: () => onHover([]),
  };
  const label = useMemo(
    () =>
      parcelLabelIcon({
        text: parcel.size,
        color,
        verified,
        on,
        seen,
        aria: parcelAria(parcel),
        below: !parcel.polygon,
      }),
    [parcel, color, verified, on, seen],
  );
  const corners = parcel.polygon ?? [at];
  const beacons = useMemo(
    () => corners.map((_, i) => beaconIcon(color, on, 0.2 + index * 0.06 + i * 0.05)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [corners.length, color, on],
  );

  return (
    <>
      {parcel.polygon ? (
        <>
          {verified && (
            <Polygon
              positions={parcel.polygon}
              interactive={false}
              pathOptions={{ color: "var(--surface)", weight: on ? 7 : 5.5, fill: false }}
            />
          )}
          <Polygon
            positions={parcel.polygon}
            eventHandlers={handlers}
            pathOptions={{
              color,
              fillColor: color,
              weight: on ? 3.5 : verified ? 2.2 : 1.8,
              fillOpacity: verified ? (on ? 0.6 : 0.42) : on ? 0.4 : 0.2,
              dashArray: verified ? undefined : "6 4",
            }}
          >
            <Tooltip sticky direction="top" offset={[0, -10]} className="gm-tip">
              <b>{parcel.parcelNumber}</b>
              <span>
                {verified ? "Verified" : "Available"} · {parcelPrice(parcel)}
              </span>
            </Tooltip>
          </Polygon>
        </>
      ) : (
        <Circle
          center={at}
          radius={70}
          eventHandlers={handlers}
          pathOptions={{
            color,
            fillColor: color,
            weight: 2,
            dashArray: "3 3",
            fillOpacity: on ? 0.26 : 0.14,
            className: "gm-approx",
          }}
        >
          <Tooltip sticky direction="top" offset={[0, -10]} className="gm-tip">
            <b>{parcel.parcelNumber}</b>
            <span>Approximate location · {parcelPrice(parcel)}</span>
          </Tooltip>
        </Circle>
      )}
      {showBeacons &&
        corners.map((c, i) => (
          <Marker
            key={i}
            position={c}
            icon={beacons[i]}
            interactive={false}
            keyboard={false}
            zIndexOffset={on ? 300 : 0}
          />
        ))}
      <Marker
        position={at}
        icon={label}
        keyboard={false}
        zIndexOffset={on ? 2000 : 1000}
        eventHandlers={handlers}
      />
    </>
  );
}

function PropertyPin({
  property,
  on,
  seen,
  onSelect,
  onHover,
}: {
  property: Property;
  on: boolean;
  seen: boolean;
  onSelect: () => void;
  onHover: (ids: string[]) => void;
}) {
  const icon = useMemo(
    () =>
      propertyIcon({
        kind: propertyKind(property.type),
        color: INTENT_COLOR[property.intent],
        label: propertyShortLabel(property),
        on,
        seen,
        aria: `${INTENT_LABELS[property.intent]}: ${property.title}, ${property.area || property.county}, ${formatPrice(property.price, property.pricePeriod)}`,
      }),
    [property, on, seen],
  );
  return (
    <Marker
      position={property.position}
      icon={icon}
      keyboard={false}
      zIndexOffset={on ? 3000 : 0}
      eventHandlers={{
        click: onSelect,
        mouseover: () => onHover([property.id]),
        mouseout: () => onHover([]),
      }}
    />
  );
}

function Layers({
  mode,
  items,
  selectedId,
  hotIds,
  seenIds,
  onSelectParcel,
  onSelectProperty,
  onHover,
  onAllClustered,
}: {
  mode: MapMode;
  items: Item[];
  selectedId: string | null;
  hotIds: string[];
  seenIds: string[];
  onSelectParcel?: (p: LandParcel | null) => void;
  onSelectProperty?: (p: Property | null) => void;
  onHover: (ids: string[]) => void;
  onAllClustered: (all: boolean) => void;
}) {
  const map = useMap();
  const [zoom, setZoom] = useState(() => map.getZoom());
  useMapEvents({ zoomend: () => setZoom(map.getZoom()) });

  const groups = useMemo(() => {
    const points: ScreenPoint[] = items.map((it) => {
      const p = map.project(it.at, zoom);
      return { id: it.id, x: p.x, y: p.y };
    });
    const byId = new Map(items.map((it) => [it.id, it]));
    return clusterByTouch(points).map((members) => ({
      points: members,
      items: members.map((m) => byId.get(m.id) as Item),
    }));
  }, [items, map, zoom]);

  const singles = groups.filter((g) => g.items.length === 1).map((g) => g.items[0]);
  const clusters = groups.filter((g) => g.items.length > 1);
  const allClustered = clusters.length > 0 && singles.length === 0;
  useEffect(() => onAllClustered(allClustered), [allClustered, onAllClustered]);

  const noun = (n: number) =>
    mode === "land"
      ? n === 1
        ? "plot"
        : "plots"
      : mode === "rentals"
        ? n === 1
          ? "home"
          : "homes"
        : n === 1
          ? "listing"
          : "listings";

  return (
    <>
      {clusters.map((g) => {
        const n = g.items.length;
        const places = new Map<string, number>();
        g.items.forEach((it) => places.set(it.place, (places.get(it.place) ?? 0) + 1));
        const topPlace = [...places.entries()].sort((a, b) => b[1] - a[1])[0][0];
        const place = topPlace + (places.size > 1 ? " area" : "");
        const counts = new Map<string, number>();
        g.items.forEach((it) => counts.set(segmentOf(it), (counts.get(segmentOf(it)) ?? 0) + 1));
        const bounds = L.latLngBounds(g.items.map((it) => it.at));
        const ids = g.items.map((it) => it.id);
        const on = ids.some((id) => id === selectedId || hotIds.includes(id));
        return (
          <Marker
            key={ids.join("|")}
            position={bounds.getCenter()}
            keyboard={false}
            zIndexOffset={4000}
            icon={clusterIcon({
              count: n,
              label: `${n} ${noun(n)} · ${place}`,
              aria: `${n} ${noun(n)} in ${place}. Zoom in to see them.`,
              on,
              segments: SEGMENT_ORDER.filter((k) => counts.has(k)).map((k) => ({
                color: SEGMENT_COLOR[k],
                share: (counts.get(k) ?? 0) / n,
              })),
            })}
            eventHandlers={{
              click: () =>
                map.flyTo(
                  bounds.getCenter(),
                  Math.min(map.getMaxZoom(), zoom + zoomStepsToSeparate(g.points)),
                  { duration: 0.8 },
                ),
              mouseover: () => onHover(ids),
              mouseout: () => onHover([]),
            }}
          />
        );
      })}
      {singles.map((it, index) =>
        it.kind === "parcel" ? (
          <ParcelShape
            key={it.id}
            parcel={it.parcel}
            at={it.at}
            index={index}
            on={it.id === selectedId || hotIds.includes(it.id)}
            seen={seenIds.includes(it.id) && it.id !== selectedId}
            showBeacons={zoom >= BEACON_MIN_ZOOM}
            onSelect={() => onSelectParcel?.(it.parcel)}
            onHover={onHover}
          />
        ) : (
          <PropertyPin
            key={it.id}
            property={it.property}
            on={it.id === selectedId || hotIds.includes(it.id)}
            seen={seenIds.includes(it.id) && it.id !== selectedId}
            onSelect={() => onSelectProperty?.(it.property)}
            onHover={onHover}
          />
        ),
      )}
    </>
  );
}

export function LandMap({
  mode,
  onSelectParcel,
  onSelectProperty,
  selectedId,
  parcels = [],
  properties = [],
  flyTarget,
  hotIds = [],
  onHover,
  seenIds = [],
  onBoundsChange,
  areaLoading = false,
  loadError = false,
  retrying = false,
  onRetry,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [isSatellite, setIsSatellite] = useState(false);
  const [searchTarget, setSearchTarget] = useState<FlyTarget | null>(null);
  const [me, setMe] = useState<[number, number] | null>(null);
  const [allClustered, setAllClustered] = useState(false);
  const dark = useIsDark();
  useEffect(() => setMounted(true), []);

  const items = useMemo<Item[]>(() => {
    const out: Item[] = [];
    if (mode !== "rentals") {
      for (const p of parcels) {
        const at = p.polygon
          ? centroid(p.polygon)
          : p.latitude != null && p.longitude != null
            ? ([p.latitude, p.longitude] as [number, number])
            : null;
        if (at) out.push({ kind: "parcel", id: p.id, at, place: p.area || p.county, parcel: p });
      }
    }
    if (mode !== "land") {
      for (const p of properties) {
        out.push({
          kind: "property",
          id: p.id,
          at: p.position,
          place: p.area || p.county,
          property: p,
        });
      }
    }
    return out;
  }, [mode, parcels, properties]);

  if (!mounted) {
    return <div className="gm-mapfill" style={{ background: "var(--mbg)" }} />;
  }

  return (
    <div className="gm-mapfill">
      <MapContainer
        center={[-1.286389, 36.817223]}
        zoom={11}
        scrollWheelZoom
        zoomControl={false}
        className="gm-map"
        style={{ height: "100%", width: "100%" }}
      >
        <ZoomControl position="bottomright" />
        <MapController
          mode={mode}
          selectedId={selectedId}
          parcels={parcels}
          properties={properties}
        />
        <BoundsWatcher onChange={onBoundsChange} />
        <FlyToTarget target={flyTarget ?? null} />
        <FlyToTarget target={searchTarget} />
        <TileLayer
          key={isSatellite ? "sat" : dark ? "dark" : "street"}
          url={isSatellite ? SATELLITE_TILES : STREET_TILES}
          attribution={isSatellite ? SATELLITE_ATTRIBUTION : STREET_ATTRIBUTION}
          className={dark && !isSatellite ? DARK_TILES_CLASS : undefined}
        />
        <Layers
          mode={mode}
          items={items}
          selectedId={selectedId ?? null}
          hotIds={hotIds}
          seenIds={seenIds}
          onSelectParcel={onSelectParcel}
          onSelectProperty={onSelectProperty}
          onHover={(ids) => onHover?.(ids)}
          onAllClustered={setAllClustered}
        />
        {me && <Marker position={me} icon={meIcon} interactive={false} keyboard={false} />}
      </MapContainer>

      <MapSatelliteToggle satellite={isSatellite} onToggle={() => setIsSatellite((s) => !s)} />
      <MapSearchBar
        onFly={(lat, lng) => setSearchTarget({ lat, lng, zoom: 14 })}
        onNearMe={(lat, lng) => setMe([lat, lng])}
      />
      <div className="gm-ctl gm-ctl-chips">
        {areaLoading && (
          <span className="gm-chipx" role="status">
            <span className="gm-spin" aria-hidden>
              <Spinner14 />
            </span>
            Loading listings in this area…
          </span>
        )}
        {allClustered && (
          <span className="gm-chipx gm-light">
            <Plus width={14} height={14} aria-hidden />
            {mode === "rentals" ? "Zoom in to see each home" : "Zoom in to see plot boundaries"}
          </span>
        )}
      </div>
      {loadError && (
        <div className="gm-err" role="alert">
          Couldn&apos;t load listings.
          <button type="button" onClick={onRetry} disabled={retrying}>
            {retrying && (
              <span className="gm-spin" aria-hidden>
                <Spinner14 />
              </span>
            )}
            Retry
          </button>
        </div>
      )}
      <MapLegend mode={mode} />
    </div>
  );
}

function Spinner14() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M21 12a9 9 0 1 1-6.2-8.6" />
    </svg>
  );
}
