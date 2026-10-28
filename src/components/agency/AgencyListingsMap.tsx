import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { ChevronRight } from "lucide-react";
import { beaconSvg, esc, propertyIcon, propertyKind } from "@/components/map/markers";
import { STREET_ATTRIBUTION, STREET_TILES } from "@/components/map/tiles";
import type { AgencyListingItem } from "@/lib/agency";
import {
  listingHref,
  listingMeta,
  listingPosition,
  listingPrice,
  listingTitle,
  TYPE_COLOR,
  TYPE_TAG,
  typeKey,
} from "@/components/agency/page/helpers";
import "@/components/map/map.css";

function landIcon(color: string, aria: string): L.DivIcon {
  return L.divIcon({
    className: "gm-bcn ag-mpin",
    html: `<span class="gm-bcn-in ag-mpin" role="button" aria-label="${esc(aria)}" style="--pc:${color}">${beaconSvg(18, 25)}</span>`,
    iconSize: [18, 25],
    iconAnchor: [9, 23],
    popupAnchor: [0, -22],
  });
}

function iconFor(l: AgencyListingItem): L.DivIcon {
  const color = TYPE_COLOR[typeKey(l)];
  const aria = `${listingTitle(l)}, ${listingPrice(l).price}`;
  if (l.kind === "parcel") return landIcon(color, aria);
  return propertyIcon({ kind: propertyKind(l.item.type), color, on: false, seen: false, aria });
}

/** Counts the listings outside the current view, by county, for the "off this map" chips. */
function OffMap({ points }: { points: { l: AgencyListingItem; at: [number, number] }[] }) {
  const map = useMap();
  const [outside, setOutside] = useState<[string, number][]>([]);
  const measure = () => {
    const bounds = map.getBounds();
    const byCounty = new Map<string, number>();
    for (const p of points) {
      if (!bounds.contains(p.at)) {
        const where = p.l.item.area || p.l.item.county;
        byCounty.set(where, (byCounty.get(where) ?? 0) + 1);
      }
    }
    setOutside([...byCounty]);
  };
  useMapEvents({ moveend: measure, zoomend: measure });
  useEffect(measure, [points]); // eslint-disable-line react-hooks/exhaustive-deps

  if (outside.length === 0) return null;
  return (
    <div className="ag-offmap">
      {outside.map(([where, n]) => (
        <span key={where}>
          <ChevronRight size={13} aria-hidden />
          {n} in {where}, off this map
        </span>
      ))}
    </div>
  );
}

/** Every listing in the current tab and filters, on the same markers as the map pages. */
export function AgencyListingsMap({ items }: { items: AgencyListingItem[] }) {
  const points = useMemo(
    () =>
      items.flatMap((l) => {
        const at = listingPosition(l);
        return at ? [{ l, at }] : [];
      }),
    [items],
  );
  const legend = [...new Set(items.map(typeKey))];
  const bounds = points.length > 1 ? L.latLngBounds(points.map((p) => p.at)).pad(0.15) : undefined;

  return (
    <div className="ag-map" role="region" aria-label="Map of listings">
      <MapContainer
        bounds={bounds}
        center={
          points.length === 1 ? points[0].at : points.length === 0 ? [-1.29, 36.82] : undefined
        }
        zoom={points.length === 1 ? 14 : points.length === 0 ? 6 : undefined}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer url={STREET_TILES} attribution={STREET_ATTRIBUTION} />
        {points.map(({ l, at }) => {
          const { price, per } = listingPrice(l);
          const photo = l.item.photos?.[0];
          return (
            <Marker key={`${l.kind}-${l.item.id}`} position={at} icon={iconFor(l)}>
              <Popup closeButton={false} minWidth={280} maxWidth={280}>
                <div className="ag-pop">
                  <span
                    className="ag-ph"
                    style={
                      photo ? { backgroundImage: `url("${photo}")` } : { background: "var(--bg2)" }
                    }
                  />
                  <span
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 3,
                      minWidth: 0,
                      flex: 1,
                    }}
                  >
                    <span
                      className={l.kind === "parcel" ? "gs-mono" : undefined}
                      style={{ fontWeight: 700, fontSize: 14 }}
                    >
                      {listingTitle(l)}
                    </span>
                    <span style={{ fontSize: 12.5, color: "var(--muted)" }}>{listingMeta(l)}</span>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>
                      {price} {per}
                    </span>
                    <a
                      href={listingHref(l)}
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      Open on the map <ChevronRight size={13} strokeWidth={2.4} aria-hidden />
                    </a>
                  </span>
                </div>
              </Popup>
            </Marker>
          );
        })}
        <OffMap points={points} />
      </MapContainer>
      <div className="ag-legend">
        {legend.map((k) => (
          <span key={k}>
            <i style={{ background: TYPE_COLOR[k] }} />
            {TYPE_TAG[k]}
          </span>
        ))}
      </div>
    </div>
  );
}
