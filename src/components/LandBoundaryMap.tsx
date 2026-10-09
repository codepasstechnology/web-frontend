import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polygon,
  Polyline,
  ZoomControl,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet-draw/dist/leaflet.draw.css";
import type { DrawEvents } from "leaflet";
import {
  AlertTriangle,
  Check,
  CircleHelp,
  Hand,
  Info,
  MapPin,
  RotateCcw,
  ShieldCheck,
  Spline,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import { MapSearchBar, FlyToLocation, MapSatelliteToggle } from "@/components/MapSearchBar";
import {
  SATELLITE_ATTRIBUTION,
  SATELLITE_TILES,
  DARK_TILES_CLASS,
  STREET_ATTRIBUTION,
  STREET_TILES,
  useIsDark,
} from "@/components/map/tiles";
import { beaconIcon, bigBeaconIcon } from "@/components/map/markers";
import { centroid, hasSelfIntersection, polygonAreaAcres, type LatLng } from "@/lib/mapGeo";
import { formatAcres, plotColors, plotStatus, sizeMismatch } from "@/lib/plotting";
import "@/components/site/site-pages.css";
import "@/components/map/map.css";

const TUTORIAL_KEY = "lv_boundary_tutorial_seen";

const OVERLAP_NOTE =
  "Part of this location is already listed. If it's your land, carry on: we'll compare the title deeds before either listing goes live.";

/** Title, text, and what the little illustration shows. */
const TUTORIAL_STEPS: { title: string; body: string; path: string; dots: boolean; pin: boolean }[] =
  [
    {
      title: "Find your land",
      body: 'Search for a place or tap "Near me", then zoom in until you can see fences, roads and roofs on the satellite view.',
      path: "",
      dots: false,
      pin: false,
    },
    {
      title: "Pin it, or trace it",
      body: 'Tap once to drop a pin. If you know the shape, choose "Trace boundary" instead. Buyers trust traced plots more.',
      path: "",
      dots: false,
      pin: true,
    },
    {
      title: "Tap each corner",
      body: 'Go around your land in order. "Undo point" removes the last corner. Tap the first corner again to close the shape.',
      path: "M70 50L160 44L166 112",
      dots: true,
      pin: false,
    },
    {
      title: "Confirm your plot",
      body: "You need at least 3 corners. We place the pin in the middle for you and show the approximate size.",
      path: "M70 50L160 44L166 112L74 118Z",
      dots: true,
      pin: true,
    },
  ];

const cornerIcon = (color: string, size: number) =>
  L.divIcon({
    className: "gm-corner",
    html: `<span style="--pc:${color}"></span>`,
    iconSize: [size, size],
  });

const centreIcon = (color: string) =>
  L.divIcon({
    className: "gm-centre",
    html: `<span style="--pc:${color}"></span>`,
    iconSize: [14, 14],
  });

const areaIcon = (text: string) =>
  L.divIcon({
    className: "gm-anchor",
    html: `<span class="gm-area">${text}</span>`,
    iconSize: [0, 0],
  });

function PinDropper({
  disabled,
  onTap,
}: {
  disabled?: boolean;
  onTap: (p: [number, number]) => void;
}) {
  useMapEvents({
    click(e) {
      if (disabled) return;
      onTap([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

function PolygonDrawTrigger({
  trigger,
  cancelTrigger,
  undoTrigger,
  finishTrigger,
  color,
  onCreated,
  onTracingChange,
  onPointsChange,
}: {
  trigger: number;
  cancelTrigger: number;
  undoTrigger: number;
  finishTrigger: number;
  color: string;
  onCreated: (boundary: LatLng[]) => void;
  onTracingChange: (tracing: boolean) => void;
  onPointsChange: (points: LatLng[]) => void;
}) {
  const map = useMap();
  const [ready, setReady] = useState(false);
  const handlerRef = useRef<L.Draw.Polygon | null>(null);

  // `onCreated`/`onTracingChange`/`onPointsChange` are inline callbacks
  // from the parent and get a new identity on every render. Reading them via
  // refs (instead of putting them in the effect below's deps) keeps that
  // effect's map.on(...) listeners registered for the component's whole
  // lifetime — otherwise a re-render right when `trigger` fires would tear
  // down and re-register the listeners in the same commit as handler.enable()
  // synchronously firing DRAWSTART, and the very first DRAWSTART would fire
  // into a momentarily-unlistened map.
  const onCreatedRef = useRef(onCreated);
  onCreatedRef.current = onCreated;
  const onTracingChangeRef = useRef(onTracingChange);
  onTracingChangeRef.current = onTracingChange;
  const onPointsChangeRef = useRef(onPointsChange);
  onPointsChangeRef.current = onPointsChange;

  // leaflet-draw touches `window` at import time, so it must never load during SSR.
  useEffect(() => {
    let cancelled = false;
    import("leaflet-draw").then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready || trigger === 0) return;
    // leaflet-draw only handles the taps; the draft itself (halo, edges,
    // closing edge, area) is drawn by LandBoundaryMap so it can be styled.
    const handler = new L.Draw.Polygon(map as L.DrawMap, {
      showArea: false,
      shapeOptions: { color, opacity: 0, fill: false },
      icon: cornerIcon(color, 16),
      touchIcon: cornerIcon(color, 22),
    });
    handlerRef.current = handler;
    handler.enable();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, trigger, map]);

  useEffect(() => {
    if (!ready || cancelTrigger === 0) return;
    handlerRef.current?.disable();
  }, [ready, cancelTrigger]);

  useEffect(() => {
    if (!ready || undoTrigger === 0) return;
    handlerRef.current?.deleteLastVertex();
  }, [ready, undoTrigger]);

  useEffect(() => {
    if (!ready || finishTrigger === 0) return;
    handlerRef.current?.completeShape();
  }, [ready, finishTrigger]);

  useEffect(() => {
    if (!ready) return;
    const onDrawStart = () => {
      map.doubleClickZoom.disable();
      onPointsChangeRef.current([]);
      onTracingChangeRef.current(true);
    };
    const onDrawStop = () => {
      map.doubleClickZoom.enable();
      onPointsChangeRef.current([]);
      onTracingChangeRef.current(false);
    };
    const onCreatedEvt = (e: L.LeafletEvent) => {
      const de = e as unknown as DrawEvents.Created;
      if (de.layerType !== "polygon" || !(de.layer instanceof L.Polygon)) return;
      const [ring] = de.layer.getLatLngs() as L.LatLng[][];
      onCreatedRef.current(ring.map((p) => ({ lat: p.lat, lng: p.lng })));
    };
    const onDrawVertex = (e: L.LeafletEvent) => {
      const markers = (e as unknown as DrawEvents.DrawVertex).layers.getLayers() as L.Marker[];
      // The first corner grows, and glows once tapping it can close the shape.
      const first = markers[0]?.getElement();
      first?.setAttribute("data-first", "true");
      first?.setAttribute("data-glow", String(markers.length >= 3));
      onPointsChangeRef.current(
        markers.map((m) => ({ lat: m.getLatLng().lat, lng: m.getLatLng().lng })),
      );
    };
    map.on(L.Draw.Event.DRAWSTART, onDrawStart);
    map.on(L.Draw.Event.DRAWSTOP, onDrawStop);
    map.on(L.Draw.Event.CREATED, onCreatedEvt);
    map.on(L.Draw.Event.DRAWVERTEX, onDrawVertex);
    return () => {
      map.off(L.Draw.Event.DRAWSTART, onDrawStart);
      map.off(L.Draw.Event.DRAWSTOP, onDrawStop);
      map.off(L.Draw.Event.CREATED, onCreatedEvt);
      map.off(L.Draw.Event.DRAWVERTEX, onDrawVertex);
    };
  }, [ready, map]);

  return null;
}

const toTuple = (p: LatLng): [number, number] => [p.lat, p.lng];

interface LandBoundaryMapProps {
  pin: [number, number] | null;
  boundary: { lat: number; lng: number }[] | null;
  onPinChange: (p: [number, number]) => void;
  onBoundaryChange: (b: { lat: number; lng: number }[] | null) => void;
  initialCenter?: [number, number];
  hintText?: string;
  heightClassName?: string;
  county?: string;
  /**
   * When true, the map ignores taps/drags until the user deliberately taps
   * once to "wake it up" — for maps embedded inline in a scrollable page,
   * so a scroll gesture that starts on the map doesn't get mistaken for a
   * pin drop or pan. Full-screen/dedicated map steps don't need this.
   */
  requireTapToActivate?: boolean;
  /** Show the first-run walkthrough overlay (and the "How it works" button). */
  tutorial?: boolean;
  /**
   * Drop the boundary-tracing controls entirely. A rental or a home for sale
   * has an address, not a surveyed outline — a pin is all it needs.
   */
  pinOnly?: boolean;
  /** The size typed in step 1, for the soft "traced shape disagrees" note. */
  typedSize?: { acres: number; label: string } | null;
  /** Hide the status line and notes under the map when the page shows its own. */
  notes?: boolean;
  /** Bump to shake the crossing-boundary note, e.g. when Next is pressed. */
  attentionKey?: number;
  /** Bump to open the walkthrough from a button outside the map. */
  openTutorialKey?: number;
  /** The server says this location overlaps land that is already listed. */
  overlapWarning?: boolean;
}

export function LandBoundaryMap({
  pin,
  boundary,
  onPinChange,
  onBoundaryChange,
  initialCenter = [-1.286389, 36.817223],
  hintText = 'Tap "Trace boundary", then click points around your land\'s edge on the satellite map — tap "Confirm plot" once you\'ve placed at least 3 points. Not sure of the exact shape? Just drop a pin instead.',
  heightClassName = "h-[65vh] sm:h-80 lg:h-[28rem]",
  county,
  requireTapToActivate = false,
  tutorial = true,
  pinOnly = false,
  typedSize,
  notes = true,
  attentionKey = 0,
  openTutorialKey = 0,
  overlapWarning = false,
}: LandBoundaryMapProps) {
  const [activated, setActivated] = useState(!requireTapToActivate);
  const [tutorialStep, setTutorialStep] = useState<number | null>(null);
  const [toast, setToast] = useState<{ text: string; key: number } | null>(null);
  const [countyChip, setCountyChip] = useState(false);
  const say = (text: string) => setToast({ text, key: Date.now() });

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!tutorial || typeof window === "undefined") return;
    try {
      if (!localStorage.getItem(TUTORIAL_KEY)) setTutorialStep(0);
    } catch {
      /* storage unavailable: skip the first-run walkthrough */
    }
  }, [tutorial]);

  useEffect(() => {
    if (openTutorialKey > 0) setTutorialStep(0);
  }, [openTutorialKey]);

  const dismissTutorial = () => {
    setTutorialStep(null);
    try {
      localStorage.setItem(TUTORIAL_KEY, "1");
    } catch {
      /* storage unavailable */
    }
  };
  const [flyCoords, setFlyCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Center on the chosen county before the seller has placed anything —
  // never overrides a pin/boundary they've already set.
  useEffect(() => {
    if (!county || pin || boundary) return;
    fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(`${county} County, Kenya`)}&format=json&limit=1`,
      { headers: { "Accept-Language": "en" } },
    )
      .then((r) => r.json())
      .then((data: { lat: string; lon: string }[]) => {
        if (!data[0]) return;
        setFlyCoords({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
        setCountyChip(true);
        setTimeout(() => setCountyChip(false), 3400);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [county]);

  const [countyMismatch, setCountyMismatch] = useState<string | null>(null);

  // Reverse-geocode the dropped pin so we can flag it if it's nowhere near
  // the county the seller picked in step 1 — a non-blocking sanity check.
  useEffect(() => {
    if (!pin || !county) {
      setCountyMismatch(null);
      return;
    }
    let cancelled = false;
    fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${pin[0]}&lon=${pin[1]}&format=json&zoom=8`,
      { headers: { "Accept-Language": "en" } },
    )
      .then((r) => r.json())
      .then((data: { address?: Record<string, string> }) => {
        if (cancelled) return;
        // Nominatim's generic "county" address field maps to Kenya's
        // sub-counties/constituencies (e.g. "Kikuyu"), not its 47 counties —
        // "state" is the field that actually holds the Kenyan county (e.g.
        // "Kiambu").
        const detected = data.address?.state ?? data.address?.county;
        if (!detected) {
          setCountyMismatch(null);
          return;
        }
        const norm = (s: string) =>
          s
            .toLowerCase()
            .replace(/\s*county\s*$/i, "")
            .trim();
        const same =
          norm(detected) === norm(county) ||
          norm(detected).includes(norm(county)) ||
          norm(county).includes(norm(detected));
        setCountyMismatch(same ? null : detected.replace(/\s*county\s*$/i, ""));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [pin, county]);

  const controlsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (controlsRef.current) L.DomEvent.disableClickPropagation(controlsRef.current);
  }, []);

  const dark = useIsDark();
  const [isSatellite, setIsSatellite] = useState(true);
  const [drawTrigger, setDrawTrigger] = useState(0);
  const [cancelTrigger, setCancelTrigger] = useState(0);
  const [undoTrigger, setUndoTrigger] = useState(0);
  const [finishTrigger, setFinishTrigger] = useState(0);
  const [draft, setDraft] = useState<LatLng[]>([]);
  const [tracing, setTracing] = useState(false);
  const [retracing, setRetracing] = useState(false);
  const colors = plotColors(isSatellite, dark);

  const draftCrosses = hasSelfIntersection(draft, false);
  const boundaryCrosses = boundary ? hasSelfIntersection(boundary) : false;
  const traceColor = retracing ? colors.retrace : colors.boundary;
  const draftColor = draftCrosses ? colors.error : traceColor;
  const boundaryAcres = boundary ? polygonAreaAcres(boundary) : null;
  const draftAcres = draft.length >= 3 ? polygonAreaAcres(draft) : null;
  const boundaryCentre = useMemo(
    () => (boundary ? centroid(boundary.map(toTuple)) : null),
    [boundary],
  );
  const pinIcon = useMemo(
    () => (boundary ? centreIcon(colors.boundary) : bigBeaconIcon(colors.boundary)),
    [boundary, colors.boundary],
  );
  const beacons = useMemo(
    () => (boundary ?? []).map((_, i) => beaconIcon(colors.boundary, false, i * 0.05)),
    [boundary, colors.boundary],
  );

  const [shake, setShake] = useState(false);
  useEffect(() => {
    if (attentionKey === 0) return;
    setShake(true);
    const t = setTimeout(() => setShake(false), 450);
    return () => clearTimeout(t);
  }, [attentionKey]);

  const handleBoundaryCreated = (b: LatLng[]) => {
    onBoundaryChange(b);
    setRetracing(false);
    onPinChange(centroid(b.map(toTuple)));
  };

  const startTrace = () => {
    setRetracing(!!boundary);
    setDrawTrigger((n) => n + 1);
  };

  const startCenter: [number, number] =
    pin ?? (boundary && boundary.length ? [boundary[0].lat, boundary[0].lng] : initialCenter);

  const chip = tracing
    ? draftCrosses
      ? "Lines are crossing. Undo the last point."
      : draft.length === 0
        ? "Tap points around your land…"
        : `${draft.length} ${draft.length === 1 ? "point" : "points"} placed${
            draft.length >= 3 ? " · tap the first corner to close" : ""
          }`
    : null;

  const status = tracing
    ? `${draft.length} ${draft.length === 1 ? "point" : "points"} placed${
        draftAcres !== null ? ` · ≈ ${formatAcres(draftAcres)} acres` : ""
      }`
    : plotStatus(pin, boundary, pinOnly);
  const statusDot = tracing
    ? traceColor
    : boundaryCrosses
      ? "var(--err)"
      : pin || boundary
        ? "var(--accent)"
        : "var(--line)";

  const tut = tutorialStep === null ? null : TUTORIAL_STEPS[tutorialStep];

  return (
    <div className="gs-root" style={{ background: "transparent", overflow: "visible" }}>
      {hintText && (
        <div className="mb-3 flex items-start justify-between gap-3">
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" /> {hintText}
          </p>
          {tutorial && (
            <button
              type="button"
              onClick={() => setTutorialStep(0)}
              className="gm-link flex flex-shrink-0 items-center gap-1"
              style={{ fontSize: 13, minHeight: 0 }}
            >
              <CircleHelp width={15} height={15} aria-hidden /> How it works
            </button>
          )}
        </div>
      )}
      <div className={`gm-plot ${heightClassName}`}>
        <MapContainer
          center={startCenter}
          zoom={pin || boundary?.length ? 15 : 11}
          zoomControl={false}
          className="gm-map"
        >
          <ZoomControl position="bottomright" />
          <TileLayer
            key={isSatellite ? "sat" : dark ? "dark" : "street"}
            url={isSatellite ? SATELLITE_TILES : STREET_TILES}
            attribution={isSatellite ? SATELLITE_ATTRIBUTION : STREET_ATTRIBUTION}
            className={dark && !isSatellite ? DARK_TILES_CLASS : undefined}
          />
          <PolygonDrawTrigger
            trigger={drawTrigger}
            cancelTrigger={cancelTrigger}
            undoTrigger={undoTrigger}
            finishTrigger={finishTrigger}
            color={traceColor}
            onCreated={handleBoundaryCreated}
            onTracingChange={(t) => {
              setTracing(t);
              if (!t) setRetracing(false);
            }}
            onPointsChange={setDraft}
          />

          {boundary && (
            <>
              <Polygon
                positions={boundary.map(toTuple)}
                interactive={false}
                pathOptions={{
                  color: "#FFFFFF",
                  weight: 5.5,
                  fill: false,
                  opacity: tracing ? 0.3 : 0.9,
                }}
              />
              <Polygon
                positions={boundary.map(toTuple)}
                interactive={false}
                pathOptions={{
                  color: boundaryCrosses ? colors.error : colors.boundary,
                  weight: 2.6,
                  fillColor: boundaryCrosses ? colors.error : colors.boundary,
                  fillOpacity: tracing ? 0.05 : 0.15,
                  opacity: tracing ? 0.55 : 1,
                  dashArray: tracing || boundaryCrosses ? "6 5" : undefined,
                }}
              />
              {!tracing &&
                boundary.map((p, i) => (
                  <Marker
                    key={i}
                    position={toTuple(p)}
                    icon={beacons[i]}
                    interactive={false}
                    keyboard={false}
                  />
                ))}
              {!tracing && boundaryCentre && boundaryAcres !== null && (
                <Marker
                  position={boundaryCentre}
                  icon={areaIcon(`≈ ${formatAcres(boundaryAcres)} acres`)}
                  interactive={false}
                  keyboard={false}
                />
              )}
            </>
          )}

          {tracing && draft.length >= 3 && (
            <Polygon
              positions={draft.map(toTuple)}
              interactive={false}
              pathOptions={{ stroke: false, fillColor: draftColor, fillOpacity: 0.22 }}
            />
          )}
          {tracing && draft.length >= 2 && (
            <>
              <Polyline
                positions={draft.map(toTuple)}
                interactive={false}
                pathOptions={{ color: "#FFFFFF", weight: 5.5, lineCap: "round" }}
              />
              <Polyline
                positions={draft.map(toTuple)}
                interactive={false}
                pathOptions={{ color: draftColor, weight: 2.8, lineCap: "round" }}
              />
              {draft.length >= 3 && (
                <Polyline
                  positions={[toTuple(draft[draft.length - 1]), toTuple(draft[0])]}
                  interactive={false}
                  pathOptions={{ color: draftColor, weight: 2.2, dashArray: "6 5" }}
                />
              )}
            </>
          )}
          {tracing && draftAcres !== null && (
            <Marker
              position={centroid(draft.map(toTuple))}
              icon={areaIcon(`≈ ${formatAcres(draftAcres)} acres`)}
              interactive={false}
              keyboard={false}
            />
          )}

          {pin && !tracing && (
            <Marker
              key={boundary ? "centre" : `${pin[0]},${pin[1]}`}
              position={pin}
              icon={pinIcon}
              interactive={false}
              keyboard={false}
            />
          )}
          <PinDropper
            disabled={tracing || !activated}
            onTap={(p) =>
              boundary && !pinOnly
                ? say('Tap "Retrace boundary" to change the shape')
                : onPinChange(p)
            }
          />
          {flyCoords && <FlyToLocation lat={flyCoords.lat} lng={flyCoords.lng} />}
        </MapContainer>

        <MapSatelliteToggle satellite={isSatellite} onToggle={() => setIsSatellite((s) => !s)} />
        <MapSearchBar
          onFly={(lat, lng) => setFlyCoords({ lat, lng })}
          onNearMe={(lat, lng) => {
            if (tracing || (boundary && !pinOnly)) return;
            onPinChange([lat, lng]);
            say("Pin dropped at your location");
          }}
        />
        <div
          className="gm-ctl gm-plot-status"
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}
        >
          {chip && (
            <span className="gm-chipx" role="status" data-error={draftCrosses}>
              {chip}
            </span>
          )}
          {countyChip && !chip && (
            <span className="gm-chipx">
              <MapPin width={15} height={15} aria-hidden /> Showing {county} County, from step 1
            </span>
          )}
        </div>

        {!pinOnly && (
          <div ref={controlsRef} className="gm-ctl gm-tracebar">
            {tracing ? (
              <>
                <button
                  type="button"
                  className="gm-tbtn"
                  onClick={() => setUndoTrigger((n) => n + 1)}
                  disabled={draft.length < 2}
                >
                  <Undo2 width={17} height={17} aria-hidden /> Undo point
                </button>
                <button
                  type="button"
                  className="gm-tbtn"
                  onClick={() => setCancelTrigger((n) => n + 1)}
                >
                  <X width={16} height={16} aria-hidden /> Cancel
                </button>
                <button
                  type="button"
                  className="gm-tbtn gm-primary"
                  onClick={() => setFinishTrigger((n) => n + 1)}
                  disabled={draft.length < 3 || draftCrosses}
                >
                  <Check width={17} height={17} strokeWidth={2.6} aria-hidden /> Confirm plot
                </button>
              </>
            ) : boundary ? (
              <>
                <button
                  type="button"
                  className="gm-tbtn gm-retrace"
                  style={{ ["--retrace" as string]: colors.retrace }}
                  onClick={startTrace}
                >
                  <RotateCcw width={17} height={17} aria-hidden /> Retrace boundary
                </button>
                <button
                  type="button"
                  className="gm-tbtn gm-danger"
                  onClick={() => {
                    onBoundaryChange(null);
                    say("Boundary deleted. Your pin is still set.");
                  }}
                >
                  <Trash2 width={17} height={17} aria-hidden /> Delete
                </button>
              </>
            ) : (
              <button type="button" className="gm-tbtn gm-primary" onClick={startTrace}>
                <Spline width={17} height={17} aria-hidden /> Trace boundary
              </button>
            )}
          </div>
        )}

        {requireTapToActivate && !activated && (
          <button type="button" className="gm-veil" onClick={() => setActivated(true)}>
            <span className="gm-chipx" style={{ fontSize: 15, padding: "14px 20px" }}>
              <Hand width={20} height={20} aria-hidden /> Tap to edit location
            </span>
          </button>
        )}

        {tut && tutorialStep !== null && (
          <div className="gm-tut" role="dialog" aria-modal="true" aria-label="How it works">
            <div className="gm-tcard">
              <div
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
              >
                <span
                  className="gm-mono"
                  style={{ fontSize: 12, letterSpacing: ".1em", color: "var(--muted)" }}
                >
                  HOW IT WORKS · {tutorialStep + 1} OF {TUTORIAL_STEPS.length}
                </span>
                <button
                  type="button"
                  className="gm-mbtn"
                  onClick={dismissTutorial}
                  aria-label="Close"
                  style={{ width: 36, height: 36, borderRadius: "50%", boxShadow: "none" }}
                >
                  <X width={16} height={16} aria-hidden />
                </button>
              </div>
              <svg className="gm-illo" viewBox="0 0 220 130" aria-hidden="true">
                <path d="M0 34H220" stroke="var(--line)" strokeWidth="14" />
                <path
                  d="M70 50 160 44 166 112 74 118Z"
                  fill="var(--soft)"
                  stroke="var(--line)"
                  strokeWidth="1.5"
                />
                {tut.path && (
                  <path
                    d={tut.path}
                    fill={tutorialStep === 3 ? "var(--accent)" : "none"}
                    fillOpacity=".3"
                    stroke="var(--accent)"
                    strokeWidth="3"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                )}
                {tut.dots &&
                  [
                    [70, 50],
                    [160, 44],
                    [166, 112],
                  ].map(([cx, cy]) => (
                    <circle
                      key={cx}
                      cx={cx}
                      cy={cy}
                      r="6"
                      fill="#FFFFFF"
                      stroke="var(--accent)"
                      strokeWidth="3"
                    />
                  ))}
                {tut.pin && (
                  <>
                    <path
                      d="M118 92s-13-11-13-21a13 13 0 0 1 26 0c0 10-13 21-13 21z"
                      fill="var(--accent)"
                    />
                    <circle cx="118" cy="71" r="5" fill="#FFFFFF" />
                  </>
                )}
              </svg>
              <h2 className="gm-h" style={{ fontSize: 24 }}>
                {tut.title}
              </h2>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: "var(--muted)" }}>
                {tut.body}
              </p>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <div className="gm-tdots" aria-hidden>
                  {TUTORIAL_STEPS.map((_, i) => (
                    <span key={i} data-on={i === tutorialStep} />
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {tutorialStep > 0 && (
                    <button
                      type="button"
                      className="gm-btn gm-ghost"
                      onClick={() => setTutorialStep(tutorialStep - 1)}
                    >
                      Back
                    </button>
                  )}
                  <button
                    type="button"
                    className="gm-btn"
                    onClick={() =>
                      tutorialStep === TUTORIAL_STEPS.length - 1
                        ? dismissTutorial()
                        : setTutorialStep(tutorialStep + 1)
                    }
                  >
                    {tutorialStep === TUTORIAL_STEPS.length - 1 ? "Start plotting" : "Next"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {toast && (
          <div key={toast.key} className="gm-toast" role="status" style={{ top: 76 }}>
            <Info width={16} height={16} aria-hidden />
            {toast.text}
          </div>
        )}
      </div>

      {notes && (
        <div className="gm-pnotes">
          <div className="gm-pline" role="status" style={{ fontWeight: 600 }}>
            <span
              className="gm-dot"
              style={{ ["--pc" as string]: statusDot, width: 10, height: 10 }}
            />
            {status}
          </div>
          {boundaryCrosses && !tracing && (
            <div className={`gm-pline${shake ? " gm-shake" : ""}`} data-tone="error" role="alert">
              <AlertTriangle
                width={18}
                height={18}
                aria-hidden
                style={{ flex: "none", marginTop: 2 }}
              />
              This boundary crosses itself. Tap &quot;Retrace boundary&quot; to redraw it.
            </div>
          )}
          {overlapWarning && !tracing && (
            <div className="gm-pline" data-tone="warn" role="status">
              <AlertTriangle
                width={18}
                height={18}
                aria-hidden
                style={{ flex: "none", marginTop: 2 }}
              />
              {OVERLAP_NOTE}
            </div>
          )}
          {countyMismatch && (
            <div className="gm-pline" data-tone="warn">
              <AlertTriangle
                width={18}
                height={18}
                aria-hidden
                style={{ flex: "none", marginTop: 2 }}
              />
              <span>
                This location looks like it&apos;s in <strong>{countyMismatch} County</strong>, but
                you chose <strong>{county}</strong> in step 1. Check the pin, or change the county.
              </span>
            </div>
          )}
          {typedSize &&
            boundaryAcres !== null &&
            !boundaryCrosses &&
            sizeMismatch(boundaryAcres, typedSize.acres) && (
              <div className="gm-pline" data-tone="soft">
                <Info width={18} height={18} aria-hidden style={{ flex: "none", marginTop: 2 }} />
                Your traced shape is about {formatAcres(boundaryAcres)} acres, but you entered{" "}
                {typedSize.label} in step 1. Check your corners, or update the size in Basic
                details. Buyers see the size you entered.
              </div>
            )}
          {!pinOnly && (
            <div className="gm-pline" data-tone="soft">
              <ShieldCheck
                width={18}
                height={18}
                aria-hidden
                style={{ flex: "none", marginTop: 2 }}
              />
              Trace only your own land. Don&apos;t include roads, road reserves or your
              neighbours&apos; plots. We check boundaries before a listing is verified.
            </div>
          )}
        </div>
      )}
      <style>{`.leaflet-draw-tooltip{display:none!important}`}</style>
    </div>
  );
}
