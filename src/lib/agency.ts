import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import { useAuth, type AgencyRole } from "./auth";
import { mapApiParcel, type ApiParcel } from "./parcels";
import { mapApiProperty, type ApiProperty, type Property } from "./properties";
import type { LandParcel } from "./landData";

export const SPECIALTIES = ["rentals", "sales", "land", "commercial", "bnb"] as const;
export type Specialty = (typeof SPECIALTIES)[number];

export const SPECIALTY_LABELS: Record<Specialty, string> = {
  rentals: "Rentals",
  sales: "Homes for sale",
  land: "Land",
  commercial: "Commercial",
  bnb: "BnBs",
};

export const SOCIALS = ["facebook", "instagram", "x", "tiktok", "linkedin", "youtube"] as const;
export type Social = (typeof SOCIALS)[number];

export const SOCIAL_LABELS: Record<Social, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  x: "X",
  tiktok: "TikTok",
  linkedin: "LinkedIn",
  youtube: "YouTube",
};

// ── Public agency pages ───────────────────────────────────────────────────────

export interface Reputation {
  rating: number | null;
  reviews: number;
  responseMinutes: number | null;
}

export interface AgencyCard extends Reputation {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  coverUrl: string | null;
  brandColor: string | null;
  tagline: string | null;
  areas: string[];
  specialties: Specialty[];
  featured: boolean;
  listings: number;
}

export interface AgencyStats {
  listings: number;
  land: number;
  /** Plots whose boundary the seller traced on the map. */
  traced: number;
  byType: Record<string, number>;
  units: number;
  availableUnits: number;
  counties: number;
  projects: number;
  /** Median days from going live to let or sold, over the last six months; null with too few. */
  daysToClose: number | null;
}

/** One row of opening hours: weekdays (0 = Sunday) and 24-hour "HH:MM" times. */
export interface OpeningHours {
  days: number[];
  open: string;
  close: string;
}

export interface AgencyProfile extends AgencyCard {
  about: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  socials: Partial<Record<Social, string>>;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  officeHours: string | null;
  hours: OpeningHours[] | null;
  viewingHours: string | null;
  memberSince: string;
  stats: AgencyStats;
  projects: {
    id: string;
    name: string;
    location: string | null;
    description: string | null;
    listings: number;
  }[];
  reviewsEnabled: boolean;
}

interface ApiReputation {
  rating: number | null;
  reviews: number;
  response_minutes: number | null;
}

interface ApiAgencyCard extends ApiReputation {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  cover_url?: string | null;
  brand_color: string | null;
  tagline: string | null;
  areas: string[];
  specialties: Specialty[];
  featured: boolean;
  listings?: number;
}

interface ApiAgencyProfile extends ApiAgencyCard {
  about: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  socials: Partial<Record<Social, string>> | [];
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  office_hours: string | null;
  hours: OpeningHours[] | null;
  viewing_hours: string | null;
  member_since: string;
  stats: {
    listings: number;
    land: number;
    traced: number;
    by_type: Record<string, number> | [];
    units: number;
    available_units: number;
    counties: number;
    projects: number;
    days_to_close: number | null;
  };
  projects: {
    id: string;
    name: string;
    location: string | null;
    description: string | null;
    listings: number;
  }[];
  reviews_enabled: boolean;
}

const mapReputation = (r: ApiReputation): Reputation => ({
  rating: r.rating,
  reviews: r.reviews ?? 0,
  responseMinutes: r.response_minutes,
});

function mapCard(a: ApiAgencyCard): AgencyCard {
  return {
    ...mapReputation(a),
    id: a.id,
    name: a.name,
    slug: a.slug,
    logoUrl: a.logo_url,
    coverUrl: a.cover_url ?? null,
    brandColor: a.brand_color,
    tagline: a.tagline,
    areas: a.areas ?? [],
    specialties: a.specialties ?? [],
    featured: a.featured ?? false,
    listings: a.listings ?? 0,
  };
}

function mapProfile(a: ApiAgencyProfile): AgencyProfile {
  return {
    ...mapCard(a),
    listings: a.stats.listings,
    about: a.about,
    phone: a.phone,
    whatsapp: a.whatsapp,
    email: a.email,
    website: a.website,
    // PHP encodes an empty map as [], so an empty array means no links.
    socials: Array.isArray(a.socials) ? {} : a.socials,
    address: a.address,
    latitude: a.latitude,
    longitude: a.longitude,
    officeHours: a.office_hours,
    hours: a.hours?.length ? a.hours : null,
    viewingHours: a.viewing_hours,
    memberSince: a.member_since,
    stats: {
      listings: a.stats.listings,
      land: a.stats.land,
      traced: a.stats.traced ?? 0,
      byType: Array.isArray(a.stats.by_type) ? {} : a.stats.by_type,
      units: a.stats.units,
      availableUnits: a.stats.available_units,
      counties: a.stats.counties,
      projects: a.stats.projects ?? 0,
      daysToClose: a.stats.days_to_close ?? null,
    },
    projects: a.projects ?? [],
    reviewsEnabled: a.reviews_enabled,
  };
}

export interface DirectoryFilters {
  q?: string;
  county?: string;
  specialty?: Specialty | "";
}

export function useAgencies(filters: DirectoryFilters) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.county) params.set("county", filters.county);
  if (filters.specialty) params.set("specialty", filters.specialty);
  const q = params.toString();

  return useQuery({
    queryKey: ["agencies", q],
    queryFn: async ({ signal }) =>
      (await api.get<{ data: ApiAgencyCard[] }>(`/agencies${q ? `?${q}` : ""}`, signal)).data.map(
        mapCard,
      ),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });
}

/** Shared by the agency page's loader (for its title and share preview) and the page itself. */
export const agencyQuery = (slug: string) => ({
  queryKey: ["agency", slug],
  queryFn: async ({ signal }: { signal?: AbortSignal }) =>
    mapProfile(await api.get<ApiAgencyProfile>(`/agencies/${slug}`, signal)),
  staleTime: 60_000,
  retry: false,
});

export function useAgency(slug: string) {
  return useQuery(agencyQuery(slug));
}

export type AgencyTab = "all" | "rent" | "sale" | "land" | "bnb" | "closed";

export interface AgencyListingFilters {
  tab: AgencyTab;
  type?: string;
  county?: string;
  bedrooms?: number;
  minPrice?: number;
  maxPrice?: number;
  project?: string;
}

export function useAgencyListings(slug: string, filters: AgencyListingFilters) {
  const params = new URLSearchParams({ tab: filters.tab });
  if (filters.type) params.set("type", filters.type);
  if (filters.county) params.set("county", filters.county);
  if (filters.bedrooms) params.set("bedrooms", String(filters.bedrooms));
  if (filters.minPrice) params.set("min_price", String(filters.minPrice));
  if (filters.maxPrice) params.set("max_price", String(filters.maxPrice));
  if (filters.project) params.set("project", filters.project);
  const q = params.toString();

  return useQuery({
    queryKey: ["agency-listings", slug, q],
    queryFn: async ({ signal }): Promise<{ properties: Property[]; parcels: LandParcel[] }> => {
      const res = await api.get<{ properties: ApiProperty[]; parcels: ApiParcel[] }>(
        `/agencies/${slug}/listings?${q}`,
        signal,
      );
      return {
        properties: res.properties.map(mapApiProperty),
        parcels: res.parcels.map(mapApiParcel),
      };
    },
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });
}

/** A listing on the agency page; closedDays is set on let or sold ones. */
export type AgencyListingItem =
  | { kind: "property"; item: Property; closedDays: number | null }
  | { kind: "parcel"; item: LandParcel; closedDays: number | null };

/**
 * Everything the agency lists plus what it let or sold recently, in one go:
 * the page counts, filters and pages through them in the browser.
 */
export function useAgencyPageListings(slug: string) {
  return useQuery({
    queryKey: ["agency-page-listings", slug],
    queryFn: async ({ signal }) => {
      type Res = {
        properties: (ApiProperty & { closed_days: number | null })[];
        parcels: (ApiParcel & { closed_days: number | null })[];
      };
      const toItems = (r: Res): AgencyListingItem[] => [
        ...r.properties.map((p) => ({
          kind: "property" as const,
          item: mapApiProperty(p),
          closedDays: p.closed_days,
        })),
        ...r.parcels.map((p) => ({
          kind: "parcel" as const,
          item: mapApiParcel(p),
          closedDays: p.closed_days,
        })),
      ];
      const [live, closed] = await Promise.all([
        api.get<Res>(`/agencies/${slug}/listings?tab=all`, signal),
        api.get<Res>(`/agencies/${slug}/listings?tab=closed`, signal),
      ]);
      return { live: toItems(live), closed: toItems(closed) };
    },
    staleTime: 60_000,
  });
}

export type ViewingSlot = "morning" | "afternoon" | "evening";

export interface ViewingRequestInput {
  listing?: { type: "parcel" | "property"; id: string };
  date: string;
  slot: ViewingSlot;
  name: string;
  phone: string;
  note: string;
  /** The hidden bot-trap field; real people leave it empty. */
  trap?: string;
}

export function useRequestViewing(slug: string) {
  return useMutation({
    mutationFn: (v: ViewingRequestInput) =>
      api.post<{ message: string }>(`/agencies/${slug}/viewing-requests`, {
        listing_type: v.listing?.type,
        listing_id: v.listing?.id,
        date: v.date,
        slot: v.slot,
        name: v.name.trim(),
        phone: v.phone.replace(/\s/g, ""),
        note: v.note.trim() || undefined,
        lv_check: v.trap || undefined,
      }),
  });
}

export function useReportAgency(slug: string) {
  return useMutation({
    mutationFn: (reason: string) =>
      api.post<{ message: string }>(`/agencies/${slug}/report`, { reason }),
  });
}

/** Where a visitor to an agency page came from, for the agency's insights. */
export function visitSource(): "direct" | "search" | "social" | "whatsapp" | "referral" {
  const ref = typeof document === "undefined" ? "" : document.referrer;
  if (!ref) return "direct";
  if (/whatsapp|wa\.me/i.test(ref)) return "whatsapp";
  if (/google\.|bing\.|duckduckgo\.|yahoo\./i.test(ref)) return "search";
  if (/facebook\.|instagram\.|t\.co|twitter\.|x\.com|tiktok\.|linkedin\./i.test(ref))
    return "social";
  return "referral";
}

// ── Reviews ───────────────────────────────────────────────────────────────────

export interface AgencyReview {
  id: string;
  rating: number;
  body: string | null;
  author: string;
  reply: string | null;
  repliedAt: string | null;
  createdAt: string;
  hidden?: boolean;
  /** Why they could review: they booked a viewing or messaged the agency. */
  context?: "viewing" | "message" | null;
}

interface ApiReview {
  id: string;
  rating: number;
  body: string | null;
  author: string;
  reply: string | null;
  replied_at: string | null;
  created_at: string;
  hidden?: boolean;
  context?: "viewing" | "message" | null;
}

const mapReview = (r: ApiReview): AgencyReview => ({
  id: r.id,
  rating: r.rating,
  body: r.body,
  author: r.author,
  reply: r.reply,
  repliedAt: r.replied_at,
  createdAt: r.created_at,
  hidden: r.hidden,
  context: r.context ?? null,
});

export function useAgencyReviews(slug: string, enabled: boolean) {
  return useQuery({
    queryKey: ["agency-reviews", slug],
    enabled,
    queryFn: async ({ signal }) => {
      const res = await api.get<
        ApiReputation & {
          data: ApiReview[];
          can_review: boolean;
          my_review: { id: string; rating: number; body: string | null } | null;
          distribution?: Record<string, number>;
        }
      >(`/agencies/${slug}/reviews`, signal);
      return {
        ...mapReputation(res),
        reviews: res.data.map(mapReview),
        distribution: [5, 4, 3, 2, 1].map((star) => ({
          star,
          count: res.distribution?.[star] ?? 0,
        })),
        count: res.reviews,
        canReview: res.can_review,
        myReview: res.my_review,
      };
    },
  });
}

export function useSubmitReview(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (review: { rating: number; body: string }) =>
      api.post<unknown>(`/agencies/${slug}/reviews`, review),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agency-reviews", slug] });
      queryClient.invalidateQueries({ queryKey: ["agency", slug] });
    },
  });
}

export function useReportReview() {
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.post<{ message: string }>(`/agency-reviews/${id}/report`, { reason }),
  });
}

// ── Leads from listing pages ──────────────────────────────────────────────────

export interface LeadInput {
  source: "message" | "viewing";
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  viewingAt?: string;
  /** The hidden bot-trap field; real people leave it empty. */
  trap?: string;
}

export function sendLead(kind: "parcel" | "property", id: string, lead: LeadInput) {
  return api.post<{ message: string }>(`/listings/${kind}/${id}/lead`, {
    source: lead.source,
    name: lead.name || undefined,
    email: lead.email || undefined,
    phone: lead.phone || undefined,
    message: lead.message || undefined,
    viewing_at: lead.viewingAt || undefined,
    lv_check: lead.trap || undefined,
  });
}

export function trackContact(
  kind: "parcel" | "property",
  id: string,
  channel: "call" | "whatsapp",
) {
  api.post(`/listings/${kind}/${id}/contact`, { channel }).catch(() => {});
}

// ── The signed-in user's own agency ──────────────────────────────────────────

export interface MyAgency {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  coverUrl: string | null;
  brandColor: string | null;
  tagline: string | null;
  about: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  socials: Partial<Record<Social, string>>;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  officeHours: string | null;
  hours: OpeningHours[] | null;
  viewingHours: string | null;
  areas: string[];
  specialties: Specialty[];
  descriptionFooter: string | null;
  watermarkPhotos: boolean;
  featured: boolean;
  myRole: AgencyRole;
  /** Leads still marked new: the agent's own, or the whole agency's for owners and managers. */
  newLeads: number;
  members: { userId: string; name: string; role: AgencyRole }[];
  projects: {
    id: string;
    name: string;
    slug: string;
    location: string | null;
    description: string | null;
  }[];
  plan: {
    name: string | null;
    slug: string | null;
    isAgencyPlan: boolean;
    teamSeats: number;
    multiUnit: boolean;
    leadInbox: boolean;
    insights: boolean;
    boostDiscount: number;
  };
}

interface ApiMyAgency {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  cover_url: string | null;
  brand_color: string | null;
  tagline: string | null;
  about: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  socials: Partial<Record<Social, string>> | [];
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  office_hours: string | null;
  hours: OpeningHours[] | null;
  viewing_hours: string | null;
  areas: string[];
  specialties: Specialty[];
  description_footer: string | null;
  watermark_photos: boolean;
  featured: boolean;
  my_role: AgencyRole;
  new_leads?: number;
  members: { user_id: string; name: string; role: AgencyRole }[];
  projects: MyAgency["projects"];
  plan: {
    name: string | null;
    slug: string | null;
    is_agency_plan: boolean;
    team_seats: number;
    multi_unit: number;
    lead_inbox: number;
    agency_insights: number;
    boost_discount: number;
  };
}

function mapMyAgency(a: ApiMyAgency): MyAgency {
  return {
    id: a.id,
    name: a.name,
    slug: a.slug,
    logoUrl: a.logo_url,
    coverUrl: a.cover_url,
    brandColor: a.brand_color,
    tagline: a.tagline,
    about: a.about,
    phone: a.phone,
    whatsapp: a.whatsapp,
    email: a.email,
    website: a.website,
    socials: Array.isArray(a.socials) ? {} : a.socials,
    address: a.address,
    latitude: a.latitude,
    longitude: a.longitude,
    officeHours: a.office_hours,
    hours: a.hours?.length ? a.hours : null,
    viewingHours: a.viewing_hours,
    areas: a.areas ?? [],
    specialties: a.specialties ?? [],
    descriptionFooter: a.description_footer,
    watermarkPhotos: a.watermark_photos,
    featured: a.featured,
    myRole: a.my_role,
    newLeads: a.new_leads ?? 0,
    members: (a.members ?? []).map((m) => ({ userId: m.user_id, name: m.name, role: m.role })),
    projects: a.projects ?? [],
    plan: {
      name: a.plan.name,
      slug: a.plan.slug,
      isAgencyPlan: a.plan.is_agency_plan,
      teamSeats: a.plan.team_seats,
      multiUnit: a.plan.multi_unit === 1,
      leadInbox: a.plan.lead_inbox === 1,
      insights: a.plan.agency_insights === 1,
      boostDiscount: a.plan.boost_discount,
    },
  };
}

/** The user's agency; never fetched for someone outside one. */
export function useMyAgency() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-agency"],
    enabled: !!user?.agency,
    queryFn: async () => mapMyAgency(await api.get<ApiMyAgency>("/user/agency")),
  });
}

export function canManage(role: AgencyRole | undefined): boolean {
  return role === "owner" || role === "manager";
}

export interface AgencyProfileInput {
  name?: string;
  tagline?: string | null;
  about?: string | null;
  brand_color?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  website?: string | null;
  socials?: Partial<Record<Social, string>>;
  address?: string | null;
  office_hours?: string | null;
  hours?: OpeningHours[] | null;
  viewing_hours?: string | null;
  areas?: string[];
  specialties?: Specialty[];
  description_footer?: string | null;
  watermark_photos?: boolean;
}

export function useCreateAgency() {
  const { reloadUser } = useAuth();
  return useMutation({
    mutationFn: (input: { name: string; areas: string[]; specialties: Specialty[] }) =>
      api.post<unknown>("/user/agency", input),
    onSuccess: () => reloadUser(),
  });
}

export function useUpdateAgency() {
  const queryClient = useQueryClient();
  const { reloadUser } = useAuth();
  return useMutation({
    mutationFn: (input: AgencyProfileInput) => api.put<unknown>("/user/agency", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-agency"] });
      reloadUser();
    },
  });
}

export function useAgencyImage(kind: "logo" | "cover") {
  const queryClient = useQueryClient();
  const { reloadUser } = useAuth();
  const done = () => {
    queryClient.invalidateQueries({ queryKey: ["my-agency"] });
    reloadUser();
  };
  const upload = useMutation({
    mutationFn: (file: File) => {
      const body = new FormData();
      body.append("image", file);
      return api.post<unknown>(`/user/agency/images/${kind}`, body);
    },
    onSuccess: done,
  });
  const remove = useMutation({
    mutationFn: () => api.delete<unknown>(`/user/agency/images/${kind}`),
    onSuccess: done,
  });
  return { upload, remove };
}

export function useProjectMutations() {
  const queryClient = useQueryClient();
  const done = () => queryClient.invalidateQueries({ queryKey: ["my-agency"] });
  type ProjectInput = { name: string; location?: string; description?: string };
  return {
    create: useMutation({
      mutationFn: (p: ProjectInput) => api.post<unknown>("/user/agency/projects", p),
      onSuccess: done,
    }),
    update: useMutation({
      mutationFn: ({ id, ...p }: ProjectInput & { id: string }) =>
        api.put<unknown>(`/user/agency/projects/${id}`, p),
      onSuccess: done,
    }),
    remove: useMutation({
      mutationFn: (id: string) => api.delete<unknown>(`/user/agency/projects/${id}`),
      onSuccess: done,
    }),
  };
}

// ── Team ──────────────────────────────────────────────────────────────────────

export interface TeamMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  role: AgencyRole;
  joinedAt: string;
  listings: number;
}

export interface Invitation {
  id: string;
  email: string;
  role: "manager" | "agent";
  expiresAt: string;
}

export function useTeam() {
  return useQuery({
    queryKey: ["agency-team"],
    queryFn: async () => {
      const res = await api.get<{
        seats: number;
        members: {
          id: string;
          user_id: string;
          name: string;
          email: string;
          phone: string | null;
          role: AgencyRole;
          joined_at: string;
          listings: number;
        }[];
        invitations: { id: string; email: string; role: "manager" | "agent"; expires_at: string }[];
      }>("/user/agency/team");
      return {
        seats: res.seats,
        members: res.members.map((m): TeamMember => ({
          id: m.id,
          userId: m.user_id,
          name: m.name,
          email: m.email,
          phone: m.phone,
          role: m.role,
          joinedAt: m.joined_at,
          listings: m.listings,
        })),
        invitations: res.invitations.map((i): Invitation => ({
          id: i.id,
          email: i.email,
          role: i.role,
          expiresAt: i.expires_at,
        })),
      };
    },
  });
}

export function useTeamMutations() {
  const queryClient = useQueryClient();
  const done = () => {
    queryClient.invalidateQueries({ queryKey: ["agency-team"] });
    queryClient.invalidateQueries({ queryKey: ["my-agency"] });
  };
  return {
    invite: useMutation({
      mutationFn: (i: { email: string; role: "manager" | "agent" }) =>
        api.post<unknown>("/user/agency/team/invitations", i),
      onSuccess: done,
    }),
    cancelInvite: useMutation({
      mutationFn: (id: string) => api.delete<unknown>(`/user/agency/team/invitations/${id}`),
      onSuccess: done,
    }),
    setRole: useMutation({
      mutationFn: ({ id, role }: { id: string; role: "manager" | "agent" }) =>
        api.patch<unknown>(`/user/agency/team/${id}`, { role }),
      onSuccess: done,
    }),
    remove: useMutation({
      mutationFn: ({ id, transferTo }: { id: string; transferTo?: string }) =>
        api.delete<unknown>(`/user/agency/team/${id}`, { transfer_to: transferTo }),
      onSuccess: done,
    }),
  };
}

export interface InvitationPreview {
  agency: { name: string; slug: string; logoUrl: string | null; brandColor: string | null };
  email: string;
  role: "manager" | "agent";
}

export function useInvitation(token: string) {
  return useQuery({
    queryKey: ["agency-invitation", token],
    enabled: !!token,
    retry: false,
    queryFn: async (): Promise<InvitationPreview> => {
      const res = await api.get<{
        agency: { name: string; slug: string; logo_url: string | null; brand_color: string | null };
        email: string;
        role: "manager" | "agent";
      }>(`/agency-invitations/${token}`);
      return {
        agency: {
          name: res.agency.name,
          slug: res.agency.slug,
          logoUrl: res.agency.logo_url,
          brandColor: res.agency.brand_color,
        },
        email: res.email,
        role: res.role,
      };
    },
  });
}

export function useAcceptInvitation() {
  const { reloadUser } = useAuth();
  return useMutation({
    mutationFn: (token: string) =>
      api.post<{ message: string }>(`/agency-invitations/${token}/accept`),
    onSuccess: () => reloadUser(),
  });
}

// ── Lead inbox ────────────────────────────────────────────────────────────────

export type LeadStatus = "new" | "contacted" | "viewing_booked" | "closed";
export type LeadSource = "message" | "viewing" | "call" | "whatsapp";
export type ViewingStatus = "requested" | "confirmed" | "rescheduled" | "declined";

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  viewing_booked: "Viewing booked",
  closed: "Closed",
};

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  message: "Message",
  viewing: "Viewing request",
  call: "Call tap",
  whatsapp: "WhatsApp tap",
};

export interface Lead {
  id: string;
  source: LeadSource;
  status: LeadStatus;
  name: string | null;
  email: string | null;
  phone: string | null;
  message: string | null;
  listingType: "parcel" | "property" | null;
  listingId: string | null;
  listingTitle: string | null;
  viewingAt: string | null;
  /** When they asked for it, in words: "Friday 30 October, morning (9 am – 12 pm)". */
  preferredTime: string | null;
  viewingStatus: ViewingStatus | null;
  assignedTo: string | null;
  assignee: string | null;
  respondedAt: string | null;
  createdAt: string;
}

interface ApiLead {
  id: string;
  source: LeadSource;
  status: LeadStatus;
  name: string | null;
  email: string | null;
  phone: string | null;
  message: string | null;
  listing_type: "parcel" | "property" | null;
  listing_id: string | null;
  listing_title: string | null;
  viewing_at: string | null;
  preferred_time?: string | null;
  viewing_status: ViewingStatus | null;
  assigned_to: string | null;
  assignee: string | null;
  responded_at: string | null;
  created_at: string;
}

const mapLead = (l: ApiLead): Lead => ({
  id: l.id,
  source: l.source,
  status: l.status,
  name: l.name,
  email: l.email,
  phone: l.phone,
  message: l.message,
  listingType: l.listing_type,
  listingId: l.listing_id,
  listingTitle: l.listing_title,
  viewingAt: l.viewing_at,
  preferredTime: l.preferred_time ?? null,
  viewingStatus: l.viewing_status,
  assignedTo: l.assigned_to,
  assignee: l.assignee,
  respondedAt: l.responded_at,
  createdAt: l.created_at,
});

export function useLeads(
  filters: { status?: LeadStatus | ""; source?: LeadSource | ""; q?: string },
  enabled = true,
) {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.source) params.set("source", filters.source);
  if (filters.q) params.set("q", filters.q);
  const q = params.toString();

  return useQuery({
    queryKey: ["agency-leads", q],
    enabled,
    retry: false,
    queryFn: async () => {
      const res = await api.get<{
        data: ApiLead[];
        counts: Partial<Record<LeadStatus, number>> | [];
      }>(`/user/agency/leads${q ? `?${q}` : ""}`);
      return { leads: res.data.map(mapLead), counts: Array.isArray(res.counts) ? {} : res.counts };
    },
    placeholderData: keepPreviousData,
    refetchInterval: 60_000,
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...patch
    }: {
      id: string;
      status?: LeadStatus;
      viewing_status?: ViewingStatus;
      viewing_at?: string;
      assigned_to?: string | null;
      responded?: boolean;
    }) => api.patch<unknown>(`/user/agency/leads/${id}`, patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["agency-leads"] }),
  });
}

export interface SavedReply {
  id: string;
  title: string;
  body: string;
}

export function useSavedReplies() {
  return useQuery({
    queryKey: ["agency-replies"],
    queryFn: () => api.get<SavedReply[]>("/user/agency/replies"),
  });
}

export function useSavedReplyMutations() {
  const queryClient = useQueryClient();
  const done = () => queryClient.invalidateQueries({ queryKey: ["agency-replies"] });
  return {
    create: useMutation({
      mutationFn: (r: { title: string; body: string }) =>
        api.post<unknown>("/user/agency/replies", r),
      onSuccess: done,
    }),
    update: useMutation({
      mutationFn: ({ id, ...r }: SavedReply) => api.put<unknown>(`/user/agency/replies/${id}`, r),
      onSuccess: done,
    }),
    remove: useMutation({
      mutationFn: (id: string) => api.delete<unknown>(`/user/agency/replies/${id}`),
      onSuccess: done,
    }),
  };
}

// ── Insights ──────────────────────────────────────────────────────────────────

export interface InsightRow {
  id: string;
  kind: "property" | "parcel";
  title: string;
  views: number;
  leads: number;
  saves: number | null;
  live: boolean;
}

export interface AgencyInsights {
  range: "7d" | "30d" | "90d";
  totals: { views: number; leads: number; pageVisits: number; liveListings: number };
  daily: { date: string; leads: number; visits: number; landViews: number }[];
  leadsBySource: Partial<Record<LeadSource, number>>;
  pageSources: Record<string, number>;
  best: InsightRow[];
  worst: InsightRow[];
  needsAttention: InsightRow[];
  staff: {
    userId: string;
    name: string;
    role: AgencyRole;
    leads: number;
    responded: number;
    responseMinutes: number | null;
  }[];
  market: {
    county: string;
    type: string;
    bedrooms: number;
    intent: string;
    low: number;
    high: number;
    comparables: number;
    yours: number;
  }[];
}

export function useAgencyInsights(range: AgencyInsights["range"], enabled: boolean) {
  return useQuery({
    queryKey: ["agency-insights", range],
    enabled,
    retry: false,
    queryFn: async (): Promise<AgencyInsights> => {
      const r = await api.get<{
        range: AgencyInsights["range"];
        totals: { views: number; leads: number; page_visits: number; live_listings: number };
        daily: { date: string; leads: number; visits: number; land_views: number }[];
        leads_by_source: Partial<Record<LeadSource, number>> | [];
        page_sources: Record<string, number> | [];
        best: InsightRow[];
        worst: InsightRow[];
        needs_attention: InsightRow[];
        staff: {
          user_id: string;
          name: string;
          role: AgencyRole;
          leads: number;
          responded: number;
          response_minutes: number | null;
        }[];
        market: AgencyInsights["market"];
      }>(`/user/agency/insights?range=${range}`);
      return {
        range: r.range,
        totals: {
          views: r.totals.views,
          leads: r.totals.leads,
          pageVisits: r.totals.page_visits,
          liveListings: r.totals.live_listings,
        },
        daily: r.daily.map((d) => ({
          date: d.date,
          leads: d.leads,
          visits: d.visits,
          landViews: d.land_views,
        })),
        leadsBySource: Array.isArray(r.leads_by_source) ? {} : r.leads_by_source,
        pageSources: Array.isArray(r.page_sources) ? {} : r.page_sources,
        best: r.best,
        worst: r.worst,
        needsAttention: r.needs_attention,
        staff: r.staff.map((s) => ({
          userId: s.user_id,
          name: s.name,
          role: s.role,
          leads: s.leads,
          responded: s.responded,
          responseMinutes: s.response_minutes,
        })),
        market: r.market,
      };
    },
  });
}

// ── The agency's own reviews ─────────────────────────────────────────────────

export function useMyAgencyReviews() {
  return useQuery({
    queryKey: ["my-agency-reviews"],
    queryFn: async () => (await api.get<ApiReview[]>("/user/agency/reviews")).map(mapReview),
  });
}

export function useReplyToReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reply }: { id: string; reply: string }) =>
      api.put<unknown>(`/user/agency/reviews/${id}/reply`, { reply }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-agency-reviews"] }),
  });
}

// ── Bulk tools ────────────────────────────────────────────────────────────────

export function useBulkTools() {
  const queryClient = useQueryClient();
  const done = () => queryClient.invalidateQueries({ queryKey: ["my-properties"] });
  return {
    duplicate: useMutation({
      mutationFn: (id: string) =>
        api.post<{ id: string; title: string }>(`/user/properties/${id}/duplicate`),
      onSuccess: done,
    }),
    update: useMutation({
      mutationFn: (b: {
        ids: string[];
        action: "price" | "taken" | "available" | "pause" | "resume";
        price?: number;
      }) =>
        api.patch<{ changed: number; skipped: number; message: string | null }>(
          "/user/properties/bulk",
          b,
        ),
      onSuccess: done,
    }),
    importCsv: useMutation({
      mutationFn: (file: File) => {
        const body = new FormData();
        body.append("file", file);
        return api.post<{
          created: number;
          errors: { line: number; message: string }[];
          message: string;
        }>("/user/properties/import", body);
      },
      onSuccess: done,
    }),
  };
}

/** "Usually replies within 1 hour" — or null when there's too little to say. */
export function responseLabel(minutes: number | null): string | null {
  if (minutes == null) return null;
  if (minutes <= 60) return "Usually replies within an hour";
  if (minutes <= 180) return "Usually replies within a few hours";
  if (minutes <= 1440) return "Usually replies within a day";
  return null;
}

/** "2026-11-03T09:00" for a datetime-local input, from an ISO string. */
export function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
