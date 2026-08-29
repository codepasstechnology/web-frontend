import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";

export type PropertyIntent = "rent" | "short_stay" | "sale";
export type PropertyType =
  "apartment" | "house" | "townhouse" | "studio" | "bedsitter" | "commercial" | "office";
export type PropertyStatus = "pending" | "available" | "taken" | "suspended";
export type PricePeriod = "month" | "night" | "total";

export interface Property {
  id: string;
  reference: string;
  title: string;
  description: string;
  county: string;
  area: string;
  intent: PropertyIntent;
  type: PropertyType;
  price: number;
  pricePeriod: PricePeriod;
  minNights: number | null;
  cleaningFee: number | null;
  bedrooms: number;
  bathrooms: number;
  furnished: boolean;
  amenities: string[];
  postedBy: "owner" | "broker";
  agent: { name: string; phone: string; agency: string };
  position: [number, number];
  photos: string[];
  featured: boolean;
}

export interface MyProperty {
  id: string;
  reference: string;
  title: string;
  county: string;
  area: string;
  intent: PropertyIntent;
  type: PropertyType;
  price: number;
  pricePeriod: PricePeriod;
  status: PropertyStatus;
  postingPaymentStatus: "not_required" | "pending" | "paid";
  views: number;
  createdAt: string;
  coverPhotoUrl: string | null;
}

interface ApiProperty {
  id: string;
  reference_number: string;
  title: string;
  description: string;
  county: string;
  area: string;
  intent: PropertyIntent;
  type: PropertyType;
  price: number;
  price_period: PricePeriod;
  min_nights: number | null;
  cleaning_fee: number | null;
  bedrooms: number;
  bathrooms: number;
  furnished: boolean;
  amenities: string[];
  posted_by: "owner" | "broker";
  agent_name: string;
  agent_phone: string;
  agent_agency: string;
  latitude: number;
  longitude: number;
  photos: string[];
  featured: boolean;
}

interface ApiMyProperty {
  id: string;
  reference_number: string;
  title: string;
  county: string;
  area: string;
  intent: PropertyIntent;
  type: PropertyType;
  price: number;
  price_period: PricePeriod;
  status: PropertyStatus;
  posting_payment_status: "not_required" | "pending" | "paid";
  views: number;
  created_at: string;
  cover_photo_url: string | null;
}

export interface PropertyFilters {
  intent?: PropertyIntent | "all";
  type?: PropertyType | "all";
  county?: string;
  bedrooms?: number;
  minPrice?: number;
  maxPrice?: number;
}

export const INTENT_LABELS: Record<PropertyIntent, string> = {
  rent: "For rent",
  short_stay: "Short stay",
  sale: "For sale",
};

export const TYPE_LABELS: Record<PropertyType, string> = {
  apartment: "Apartment",
  house: "House",
  townhouse: "Townhouse",
  studio: "Studio",
  bedsitter: "Bedsitter",
  commercial: "Commercial",
  office: "Office",
};

/** "KES 75,000 / month", "KES 4,500 / night", "KES 8,500,000". */
export function formatPrice(price: number, period: PricePeriod): string {
  const amount = `KES ${price.toLocaleString()}`;

  return period === "total" ? amount : `${amount} / ${period}`;
}

export function mapApiProperty(p: ApiProperty): Property {
  return {
    id: p.id,
    reference: p.reference_number,
    title: p.title,
    description: p.description ?? "",
    county: p.county ?? "",
    area: p.area ?? "",
    intent: p.intent,
    type: p.type,
    price: p.price,
    pricePeriod: p.price_period,
    minNights: p.min_nights,
    cleaningFee: p.cleaning_fee,
    bedrooms: p.bedrooms ?? 0,
    bathrooms: p.bathrooms ?? 0,
    furnished: p.furnished ?? false,
    amenities: p.amenities ?? [],
    postedBy: p.posted_by,
    agent: {
      name: p.agent_name || "—",
      phone: p.agent_phone || "—",
      agency: p.agent_agency || "",
    },
    position: [Number(p.latitude), Number(p.longitude)],
    photos: p.photos ?? [],
    featured: p.featured ?? false,
  };
}

function mapApiMyProperty(p: ApiMyProperty): MyProperty {
  return {
    id: p.id,
    reference: p.reference_number,
    title: p.title,
    county: p.county ?? "",
    area: p.area ?? "",
    intent: p.intent,
    type: p.type,
    price: p.price,
    pricePeriod: p.price_period,
    status: p.status,
    postingPaymentStatus: p.posting_payment_status,
    views: p.views ?? 0,
    createdAt: p.created_at,
    coverPhotoUrl: p.cover_photo_url,
  };
}

function toQuery(filters: PropertyFilters): string {
  const params = new URLSearchParams();
  if (filters.intent && filters.intent !== "all") params.set("intent", filters.intent);
  if (filters.type && filters.type !== "all") params.set("type", filters.type);
  if (filters.county && filters.county !== "All") params.set("county", filters.county);
  if (filters.bedrooms) params.set("bedrooms", String(filters.bedrooms));
  if (filters.minPrice) params.set("min_price", String(filters.minPrice));
  if (filters.maxPrice) params.set("max_price", String(filters.maxPrice));

  const q = params.toString();
  return q ? `?${q}` : "";
}

export function usePublicProperties(filters: PropertyFilters = {}) {
  return useQuery({
    queryKey: ["properties", filters],
    queryFn: async () => {
      const page = await api.get<{ data: ApiProperty[] }>(`/properties${toQuery(filters)}`);
      return page.data.map(mapApiProperty);
    },
    staleTime: 60_000,
  });
}

export function useMyProperties() {
  return useQuery({
    queryKey: ["my-properties"],
    queryFn: async () => (await api.get<ApiMyProperty[]>("/user/properties")).map(mapApiMyProperty),
  });
}

/**
 * The API takes multipart because of the photo uploads, so the payload is
 * assembled as FormData rather than JSON.
 */
export interface PropertyDraft {
  title: string;
  county: string;
  area?: string;
  description?: string;
  intent: PropertyIntent;
  type: PropertyType;
  price: number;
  bedrooms?: number;
  bathrooms?: number;
  furnished?: boolean;
  amenities?: string[];
  minNights?: number;
  cleaningFee?: number;
  postedBy?: "owner" | "broker";
  agentName?: string;
  agentPhone?: string;
  agentAgency?: string;
  latitude: number;
  longitude: number;
  photos?: File[];
}

function toFormData(draft: PropertyDraft): FormData {
  const body = new FormData();
  body.append("title", draft.title);
  body.append("county", draft.county);
  body.append("intent", draft.intent);
  body.append("type", draft.type);
  body.append("price", String(draft.price));
  body.append("latitude", String(draft.latitude));
  body.append("longitude", String(draft.longitude));
  if (draft.area) body.append("area", draft.area);
  if (draft.description) body.append("description", draft.description);
  if (draft.bedrooms != null) body.append("bedrooms", String(draft.bedrooms));
  if (draft.bathrooms != null) body.append("bathrooms", String(draft.bathrooms));
  if (draft.furnished != null) body.append("furnished", draft.furnished ? "1" : "0");
  if (draft.minNights != null) body.append("min_nights", String(draft.minNights));
  if (draft.cleaningFee != null) body.append("cleaning_fee", String(draft.cleaningFee));
  if (draft.postedBy) body.append("posted_by", draft.postedBy);
  if (draft.agentName) body.append("agent_name", draft.agentName);
  if (draft.agentPhone) body.append("agent_phone", draft.agentPhone);
  if (draft.agentAgency) body.append("agent_agency", draft.agentAgency);
  (draft.amenities ?? []).forEach((a) => body.append("amenities[]", a));
  (draft.photos ?? []).forEach((f) => body.append("photos[]", f));

  return body;
}

export interface CreatedProperty extends MyProperty {
  postingFeeAmount: number;
}

export function useCreateProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (draft: PropertyDraft) => {
      const created = await api.post<ApiMyProperty & { posting_fee_amount: number }>(
        "/user/properties",
        toFormData(draft),
      );
      return { ...mapApiMyProperty(created), postingFeeAmount: created.posting_fee_amount };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-properties"] }),
  });
}

export function useUpdateProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, draft }: { id: string; draft: PropertyDraft }) => {
      // Laravel does not parse multipart bodies on PATCH, so the method is
      // spoofed the way the land-listing update does it.
      const body = toFormData(draft);
      body.append("_method", "PATCH");
      return api.post<unknown>(`/user/properties/${id}`, body);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-properties"] }),
  });
}

export function useDeleteProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete<unknown>(`/user/properties/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-properties"] }),
  });
}

export function useMarkPropertyTaken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.patch<unknown>(`/user/properties/${id}/taken`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-properties"] }),
  });
}
