import { api, API_BASE } from "./api";
import type { ApiParcel } from "./parcels";

interface SharedProperty {
  id: string;
  title: string;
  area: string;
  county: string;
  intent: "rent" | "bnb" | "sale";
  price: number;
  photos: string[];
}

export type ShareData =
  { kind: "parcel"; parcel: ApiParcel } | { kind: "property"; property: SharedProperty } | null;

type Meta = { title?: string; name?: string; property?: string; content?: string };

/**
 * Loads the listing a shared link names, on the server only: link previews
 * (WhatsApp, Facebook) read the server-rendered meta tags and never run the
 * map. In the browser the page already has the listing, so this is a no-op.
 */
export async function shareQuery(parcel?: string, property?: string): Promise<ShareData> {
  if (typeof window !== "undefined") return null;
  try {
    if (parcel) return { kind: "parcel", parcel: await api.get<ApiParcel>(`/parcels/${parcel}`) };
    if (property) {
      return {
        kind: "property",
        property: await api.get<SharedProperty>(`/properties/${property}`),
      };
    }
  } catch {
    /* unknown or unpublished listing: fall back to the page's own tags */
  }
  return null;
}

const kes = (n: number) => `KES ${Math.round(n).toLocaleString("en-US")}`;

export function shareHead(
  data: ShareData | undefined,
  fallback: { title: string; description: string },
): { meta: Meta[] } {
  let title = fallback.title;
  let description = fallback.description;
  let image: string | null = null;

  if (data?.kind === "parcel") {
    const p = data.parcel;
    const place = p.area || p.county;
    title = `${p.size} plot, ${place} (${p.parcel_number}) — Geo Pin Properties`;
    description = [
      p.listing_type === "lease" ? "Land for lease" : "Land for sale",
      p.listing_type === "lease" ? `${kes(p.price)} / yr` : kes(p.price),
      `${place}, ${p.county} County`,
      p.status === "verified" ? "Verified by Geo Pin" : "",
    ]
      .filter(Boolean)
      .join(" · ");
    image = `${API_BASE}/og/parcel/${p.id}.png`;
  } else if (data?.kind === "property") {
    const p = data.property;
    title = `${p.title}, ${p.area || p.county} — Geo Pin Properties`;
    description = `${kes(p.price)}${p.intent === "rent" ? " / month" : p.intent === "bnb" ? " / night" : ""} · ${p.area ? `${p.area}, ` : ""}${p.county} County`;
    image = p.photos[0] ?? null;
  }

  const meta: Meta[] = [
    { title },
    { name: "description", content: description },
    { property: "og:type", content: "website" },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
  ];
  if (image) {
    meta.push(
      { property: "og:image", content: image },
      { property: "og:image:alt", content: title },
      { name: "twitter:image", content: image },
      { name: "twitter:card", content: "summary_large_image" },
    );
    if (data?.kind === "parcel") {
      meta.push(
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
      );
    }
  }
  return { meta };
}
