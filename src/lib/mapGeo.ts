export type LatLng = { lat: number; lng: number };

/** west, south, east, north — the order the API's `bbox` parameter takes. */
export type Bbox = [number, number, number, number];

export function bboxParam(bbox: Bbox): string {
  return bbox.map((n) => n.toFixed(5)).join(",");
}

function segmentsIntersect(p1: LatLng, p2: LatLng, p3: LatLng, p4: LatLng): boolean {
  const d = (a: LatLng, b: LatLng, c: LatLng) =>
    (c.lng - a.lng) * (b.lat - a.lat) - (b.lng - a.lng) * (c.lat - a.lat);
  const d1 = d(p3, p4, p1);
  const d2 = d(p3, p4, p2);
  const d3 = d(p1, p2, p3);
  const d4 = d(p1, p2, p4);
  return (d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)
    ? (d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0)
    : false;
}

/** Whether any two non-adjacent edges cross. `closed` adds the edge back to the first point. */
export function hasSelfIntersection(points: LatLng[], closed = true): boolean {
  const n = points.length;
  const edges = closed ? n : n - 1;
  if (n < 4) return false;
  for (let i = 0; i < edges; i++) {
    for (let j = i + 2; j < edges; j++) {
      if (closed && i === 0 && j === n - 1) continue;
      if (segmentsIntersect(points[i], points[(i + 1) % n], points[j], points[(j + 1) % n])) {
        return true;
      }
    }
  }
  return false;
}

export function polygonAreaAcres(points: LatLng[]): number {
  const R = 6378137;
  const lat0 = (points.reduce((s, p) => s + p.lat, 0) / points.length) * (Math.PI / 180);
  const xy = points.map((p): [number, number] => [
    R * (p.lng * (Math.PI / 180)) * Math.cos(lat0),
    R * (p.lat * (Math.PI / 180)),
  ]);
  let area = 0;
  for (let i = 0; i < xy.length; i++) {
    const [x1, y1] = xy[i];
    const [x2, y2] = xy[(i + 1) % xy.length];
    area += x1 * y2 - x2 * y1;
  }
  return Math.abs(area) / 2 / 4046.8564224;
}

/** The average of the corners — where the plotting map puts the pin and the browse map the label. */
export function centroid(points: [number, number][]): [number, number] {
  return [
    points.reduce((s, p) => s + p[0], 0) / points.length,
    points.reduce((s, p) => s + p[1], 0) / points.length,
  ];
}

/**
 * Acres from the size text sellers type ("1/8 acre", "2 acres", "0.5 ha",
 * "50 x 100 ft"). Null when the text can't be read.
 */
export function parseAcres(size: string): number | null {
  const s = size.toLowerCase().replace(/,/g, "").trim();
  const ft = s.match(/^(\d+(?:\.\d+)?)\s*(?:x|×|by)\s*(\d+(?:\.\d+)?)\s*(?:ft|feet)?$/);
  if (ft) return (Number(ft[1]) * Number(ft[2])) / 43560;
  const num = s.match(/^(\d+)\s*\/\s*(\d+)|^(\d+(?:\.\d+)?)/);
  if (!num) return null;
  const value = num[1] ? Number(num[1]) / Number(num[2]) : Number(num[3]);
  if (!value) return null;
  if (/\b(ha|hectares?)\b/.test(s)) return value * 2.4710538;
  if (/\bacres?\b|\bac\b/.test(s)) return value;
  return null;
}

/** "1.49175° S, 36.98848° E" */
export function formatCoords(lat: number, lng: number): string {
  return `${Math.abs(lat).toFixed(5)}° ${lat < 0 ? "S" : "N"}, ${Math.abs(lng).toFixed(5)}° ${lng < 0 ? "W" : "E"}`;
}

export interface ScreenPoint {
  id: string;
  x: number;
  y: number;
}

/** Map icons need about this much room before they start to touch. */
export const TOUCH_PX = 58;

/**
 * Greedy collision clustering: a point joins the first group whose centre is
 * closer than `touch` pixels, and the group's centre moves to the average of
 * its members. Points with room around them stay on their own.
 */
export function clusterByTouch(points: ScreenPoint[], touch = TOUCH_PX): ScreenPoint[][] {
  const groups: { members: ScreenPoint[]; x: number; y: number }[] = [];
  for (const p of points) {
    const hit = groups.find((g) => Math.hypot(g.x - p.x, g.y - p.y) < touch);
    if (hit) {
      hit.members.push(p);
      hit.x = hit.members.reduce((s, m) => s + m.x, 0) / hit.members.length;
      hit.y = hit.members.reduce((s, m) => s + m.y, 0) / hit.members.length;
    } else {
      groups.push({ members: [p], x: p.x, y: p.y });
    }
  }
  return groups.map((g) => g.members);
}

/** Extra zoom levels needed before every pair in `points` is at least `touch` px apart. */
export function zoomStepsToSeparate(points: ScreenPoint[], touch = TOUCH_PX): number {
  let steps = 1;
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const d = Math.max(1, Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y));
      steps = Math.max(steps, Math.log2((touch * 1.25) / d));
    }
  }
  return Math.ceil(steps);
}

/** Fits a lat/lng outline into a W×H share preview (200×120 of it), north up. */
export function previewOutline(points: [number, number][], W = 360, H = 200): [number, number][] {
  const lat0 = (points.reduce((s, p) => s + p[0], 0) / points.length) * (Math.PI / 180);
  const xy = points.map(([lat, lng]): [number, number] => [lng * Math.cos(lat0), -lat]);
  const xs = xy.map((p) => p[0]);
  const ys = xy.map((p) => p[1]);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const w = Math.max(...xs) - minX || 1e-9;
  const h = Math.max(...ys) - minY || 1e-9;
  const scale = Math.min(200 / w, 120 / h);
  const ox = W / 2 - (w * scale) / 2;
  const oy = H / 2 - (h * scale) / 2;
  return xy.map(([x, y]) => [
    Math.round(ox + (x - minX) * scale),
    Math.round(oy + (y - minY) * scale),
  ]);
}
