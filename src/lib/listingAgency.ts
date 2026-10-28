/** The agency brand a listing carries, and who to contact about it. */
export interface ListingAgency {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  brandColor: string | null;
  /** The number buyers call: the assigned agent's, else the agency's. */
  phone: string;
  whatsapp: string;
  agent: { name: string; phone: string } | null;
  viewingHours: string | null;
}

export interface ApiListingAgency {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  brand_color: string | null;
  phone: string | null;
  whatsapp: string | null;
  agent?: { name: string; phone: string | null } | null;
  contact_phone?: string | null;
  viewing_hours?: string | null;
}

export function mapListingAgency(a: ApiListingAgency | null | undefined): ListingAgency | null {
  if (!a) return null;
  const phone = a.contact_phone ?? a.phone ?? "";
  return {
    id: a.id,
    name: a.name,
    slug: a.slug,
    logoUrl: a.logo_url,
    brandColor: a.brand_color,
    phone,
    whatsapp: a.whatsapp ?? phone,
    agent: a.agent ? { name: a.agent.name, phone: a.agent.phone ?? phone } : null,
    viewingHours: a.viewing_hours ?? null,
  };
}

/** Two-letter fallback when an agency has no logo yet. */
export function agencyInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}
