import L from "leaflet";
import type { ListingType } from "@/lib/landData";
import { TYPE_LABELS, type Property, type PropertyIntent } from "@/lib/properties";

/** Land is coloured by deal, properties by intent; verified/available is shown by the edge. */
export const DEAL_COLOR: Record<ListingType, string> = {
  sale: "var(--s-lsale)",
  lease: "var(--s-lease)",
};

export const INTENT_COLOR: Record<PropertyIntent, string> = {
  rent: "var(--s-rent)",
  sale: "var(--s-bsale)",
  bnb: "var(--s-bnb)",
};

export const DEAL_TAG: Record<ListingType, string> = {
  sale: "Land for sale",
  lease: "Land for lease",
};

export function esc(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c,
  );
}

const TICK = '<path d="m5 12 5 5L20 7"/>';

/** The isometric survey beacon: cream concrete body, cap and band in the listing colour. */
export function beaconSvg(width: number, height: number): string {
  return `<svg width="${width}" height="${height}" viewBox="0 0 16 22" aria-hidden="true"><path d="M2 6 8 9 8 20 2 17Z" fill="var(--mkd)" stroke="rgba(0,0,0,.38)" stroke-width=".7" stroke-linejoin="round"/><path d="M8 9 14 6 14 17 8 20Z" fill="var(--mkd)" stroke="rgba(0,0,0,.38)" stroke-width=".7" stroke-linejoin="round"/><path d="M8 9 14 6 14 17 8 20Z" fill="rgba(0,0,0,.24)"/><path d="M2 10.5 8 13.5 8 15.5 2 12.5Z" fill="var(--pc)"/><path d="M8 13.5 14 10.5 14 12.5 8 15.5Z" fill="var(--pc)"/><path d="M8 13.5 14 10.5 14 12.5 8 15.5Z" fill="rgba(0,0,0,.25)"/><path d="M8 3 14 6 8 9 2 6Z" fill="var(--pc)" stroke="rgba(0,0,0,.38)" stroke-width=".7" stroke-linejoin="round"/><path d="M8 3 14 6 8 9 2 6Z" fill="rgba(255,255,255,.18)"/></svg>`;
}

/** A corner beacon whose foot sits exactly on the vertex. */
export function beaconIcon(color: string, on: boolean, delay = 0): L.DivIcon {
  return L.divIcon({
    className: "gm-bcn",
    html: `<span class="gm-bcn-in" data-on="${on}" style="--pc:${color};animation-delay:${delay.toFixed(2)}s">${beaconSvg(16, 22)}</span>`,
    iconSize: [16, 22],
    iconAnchor: [8, 20],
  });
}

/** The larger beacon the plotting map drops for the seller's pin. */
export function bigBeaconIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: "gm-bcn gm-bcn-big",
    html: `<span class="gm-bcn-in gm-bcn-drop" style="--pc:${color}">${beaconSvg(26, 36)}</span>`,
    iconSize: [26, 36],
    iconAnchor: [13, 33],
  });
}

/** The size label in the middle of a plot. It is the plot's click and keyboard target. */
export function parcelLabelIcon(opts: {
  text: string;
  color: string;
  verified: boolean;
  on: boolean;
  seen: boolean;
  aria: string;
  /** Sit just below a lone beacon instead of on the point. */
  below?: boolean;
}): L.DivIcon {
  const tick = opts.verified
    ? `<span class="gm-ptick"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${TICK}</svg></span>`
    : "";
  return L.divIcon({
    className: "gm-anchor",
    html: `<button type="button" class="gm-plab" data-on="${opts.on}" data-seen="${opts.seen}" style="--pc:${opts.color}" aria-label="${esc(opts.aria)}">${tick}${esc(opts.text)}</button>`,
    iconSize: [0, 0],
    iconAnchor: opts.below ? [0, -18] : [0, 0],
  });
}

export type PropertyKind = "house" | "apt";

export function propertyKind(type: Property["type"]): PropertyKind {
  return type === "house" || type === "townhouse" ? "house" : "apt";
}

export function propertyShortLabel(p: Pick<Property, "bedrooms" | "type">): string {
  return p.bedrooms > 0 ? `${p.bedrooms} bd` : TYPE_LABELS[p.type];
}

const HOUSE_SVG =
  '<svg width="44" height="48" viewBox="0 0 44 48" aria-hidden="true"><path d="M7 38 22 46 22 33 7 25Z" fill="var(--pc)"/><path d="M22 46 37 38 37 25 22 33Z" fill="var(--pc)"/><path d="M22 46 37 38 37 25 22 33Z" fill="rgba(0,0,0,.26)"/><path d="M7 25 22 33 22 9Z" fill="var(--pc)"/><path d="M7 25 22 33 22 9Z" fill="rgba(255,255,255,.22)"/><path d="M22 33 37 25 22 9Z" fill="var(--pc)"/><path d="M22 33 37 25 22 9Z" fill="rgba(0,0,0,.1)"/><path d="M7 38 22 46 22 33 7 25Z M22 46 37 38 37 25 22 33Z M7 25 22 33 22 9Z M22 33 37 25 22 9Z" stroke="var(--surface)" stroke-width="1.3" stroke-linejoin="round" fill="none"/><path d="M12.5 39.8 16.5 41.9 16.5 35.4 12.5 33.3Z" fill="var(--surface)"/><path d="M26.5 37.6 32 34.6 32 30.6 26.5 33.6Z" fill="var(--surface)" opacity=".9"/></svg>';

const APT_SVG =
  '<svg width="44" height="48" viewBox="0 0 44 48" aria-hidden="true"><path d="M11 40 22 46 22 16 11 10Z" fill="var(--pc)"/><path d="M22 46 33 40 33 10 22 16Z" fill="var(--pc)"/><path d="M22 46 33 40 33 10 22 16Z" fill="rgba(0,0,0,.26)"/><path d="M11 10 22 4 33 10 22 16Z" fill="var(--pc)"/><path d="M11 10 22 4 33 10 22 16Z" fill="rgba(255,255,255,.25)"/><path d="M13.5 16.4 19.5 19.7 19.5 22.4 13.5 19.1Z M13.5 23 19.5 26.3 19.5 29 13.5 25.7Z M13.5 29.6 19.5 32.9 19.5 35.6 13.5 32.3Z M13.5 36.2 19.5 39.5 19.5 42.2 13.5 38.9Z" fill="var(--surface)" opacity=".9"/><path d="M24.5 19.7 30.5 16.4 30.5 19.1 24.5 22.4Z M24.5 26.3 30.5 23 30.5 25.7 24.5 29Z M24.5 32.9 30.5 29.6 30.5 32.3 24.5 35.6Z M24.5 39.5 30.5 36.2 30.5 38.9 24.5 42.2Z" fill="var(--surface)" opacity=".55"/><path d="M11 40 22 46 22 16 11 10Z M22 46 33 40 33 10 22 16Z M11 10 22 4 33 10 22 16Z" stroke="var(--surface)" stroke-width="1.3" stroke-linejoin="round" fill="none"/></svg>';

/** 3D house or apartment block, anchored bottom centre on the pin. */
export function propertyIcon(opts: {
  kind: PropertyKind;
  color: string;
  label: string;
  on: boolean;
  seen: boolean;
  aria: string;
}): L.DivIcon {
  return L.divIcon({
    className: `lv-pin-icon${opts.on ? " lv-pin-icon-selected" : ""}`,
    html: `<button type="button" class="gm-pin" data-on="${opts.on}" data-seen="${opts.seen}" style="--pc:${opts.color}" aria-label="${esc(opts.aria)}"><span class="gm-ground"></span><span class="gm-ring"></span><span class="gm-mk">${opts.kind === "house" ? HOUSE_SVG : APT_SVG}</span><span class="gm-lbl">${esc(opts.label)}</span></button>`,
    iconSize: [44, 48],
    iconAnchor: [22, 48],
  });
}

/** Count bubble inside a ring split by deal or intent. */
export function clusterIcon(opts: {
  count: number;
  label: string;
  aria: string;
  segments: { color: string; share: number }[];
  on: boolean;
}): L.DivIcon {
  const size = 40 + Math.min(opts.count, 8) * 4;
  let acc = 0;
  const stops = opts.segments
    .map((s) => {
      const from = acc;
      acc += s.share * 100;
      return `${s.color} ${from.toFixed(1)}% ${acc.toFixed(1)}%`;
    })
    .join(", ");
  return L.divIcon({
    className: "gm-anchor",
    html: `<button type="button" class="gm-clu" data-on="${opts.on}" aria-label="${esc(opts.aria)}" style="--cs:${size}px"><span class="gm-cring" style="background:conic-gradient(${stops})"><span class="gm-cnum">${opts.count}</span></span><span class="gm-clab">${esc(opts.label)}</span></button>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

export const meIcon = L.divIcon({
  className: "gm-me",
  html: "<span></span>",
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});
