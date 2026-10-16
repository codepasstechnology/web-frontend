export function directionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat.toFixed(6)},${lng.toFixed(6)}`;
}

export function streetViewUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat.toFixed(6)},${lng.toFixed(6)}`;
}

/** Opens WhatsApp's own picker of who to send it to. */
export function whatsappShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function listingUrl(
  page: "land" | "explore" | "rentals",
  kind: "parcel" | "property",
  id: string,
): string {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return `${origin}/${page}?${kind}=${encodeURIComponent(id)}`;
}
