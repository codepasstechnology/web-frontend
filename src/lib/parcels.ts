import {
  keepPreviousData,
  useQueries,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "./api";
import type { LandParcel, LandStatus } from "./landData";
import { bboxParam, type Bbox } from "./mapGeo";
import { mapListingAgency, type ApiListingAgency } from "./listingAgency";

interface ApiParcelSummary {
  id: string;
  parcel_number: string;
  county: string;
  price: number;
  listing_type: "sale" | "lease";
  verified: boolean;
  featured: boolean;
  photos: string[] | null;
}

export interface ParcelSummary {
  id: string;
  parcelNumber: string;
  county: string;
  price: number;
  listingType: "sale" | "lease";
  verified: boolean;
  featured: boolean;
  coverPhotoUrl: string | null;
}

export function usePublicParcels() {
  return useQuery({
    queryKey: ["parcels"],
    queryFn: async () =>
      (await api.get<ApiParcelSummary[]>("/parcels")).map((p): ParcelSummary => ({
        id: p.id,
        parcelNumber: p.parcel_number,
        county: p.county,
        price: p.price,
        listingType: p.listing_type,
        verified: p.verified,
        featured: p.featured,
        coverPhotoUrl: p.photos?.[0] ?? null,
      })),
    staleTime: 60_000,
  });
}

export interface ApiParcel {
  id: string;
  title: string;
  parcel_number: string;
  county: string;
  price: number;
  size: string;
  area: string;
  description: string;
  land_type: string;
  listing_type: "sale" | "lease";
  posted_by: "owner" | "broker";
  verified: boolean;
  featured: boolean;
  status: string;
  latitude: number;
  longitude: number;
  boundary: { lat: number; lng: number }[] | null;
  boundary_source: string | null;
  sv_available?: boolean | null;
  seller_name: string;
  seller_phone: string;
  seller_agency: string;
  agency?: ApiListingAgency | null;
  project?: string | null;
  photos: string[];
  amenities: {
    school: string | null;
    hospital: string | null;
    shopping: string | null;
    main_road: string | null;
    distance_to_tarmac: string | null;
    utilities: string[];
    development_score: number;
  } | null;
}

// Fields are re-checked here because a partial or malformed response would
// otherwise crash the panels (e.g. price.toLocaleString on undefined).
export function mapApiParcel(p: ApiParcel): LandParcel {
  return {
    id: p.id,
    title: p.parcel_number ?? "",
    parcelNumber: p.parcel_number ?? "",
    size: p.size || "—",
    price: Number(p.price) || 0,
    status: (p.status === "verified" ? "verified" : "available") as LandStatus,
    listingType: p.listing_type === "lease" ? "lease" : "sale",
    postedBy: p.posted_by === "broker" ? "broker" : "owner",
    county: p.county ?? "",
    description: p.description || "",
    verified: p.verified === true,
    featured: p.featured === true,
    photos: Array.isArray(p.photos) ? p.photos : [],
    seller: {
      name: p.seller_name || "—",
      phone: p.seller_phone || "—",
      agency: p.seller_agency || "",
    },
    amenities: {
      school: p.amenities?.school ?? "—",
      hospital: p.amenities?.hospital ?? "—",
      shopping: p.amenities?.shopping ?? "—",
      mainRoad: p.amenities?.main_road ?? "—",
      distanceToTarmac: p.amenities?.distance_to_tarmac ?? "—",
      utilities: Array.isArray(p.amenities?.utilities) ? p.amenities.utilities : [],
      developmentScore: p.amenities?.development_score ?? 0,
    },
    polygon:
      Array.isArray(p.boundary) && p.boundary.length >= 3
        ? p.boundary.map((v): [number, number] => [Number(v.lat), Number(v.lng)])
        : undefined,
    latitude: p.latitude != null ? Number(p.latitude) : undefined,
    longitude: p.longitude != null ? Number(p.longitude) : undefined,
    area: p.area || undefined,
    landUse: p.land_type ? p.land_type.charAt(0).toUpperCase() + p.land_type.slice(1) : undefined,
    svAvailable: p.sv_available ?? null,
    agency: mapListingAgency(p.agency),
    project: p.project ?? null,
  };
}

/**
 * Lightweight summaries with boundaries for map pages. Detail panels fetch by id. With a
 * bbox only the visible area is loaded; the previous result stays on screen
 * until the new one arrives, and a superseded request is cancelled.
 */
export function useMapParcels(bbox: Bbox | null = null, refetchInterval?: number) {
  return useQuery({
    queryKey: ["parcels", "map-summary", bbox],
    enabled: bbox !== null,
    queryFn: async ({ signal }) =>
      (await api.get<ApiParcel[]>(`/parcels?map=1&bbox=${bboxParam(bbox!)}`, signal)).map(
        mapApiParcel,
      ),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
    refetchInterval,
  });
}

/** The signed-in buyer's saved parcels, and a toggle that keeps the list in sync. */
export function useSavedParcels(signedIn: boolean) {
  const queryClient = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["favorites"],
    queryFn: () => api.get<string[]>("/user/favorites"),
    enabled: signedIn,
  });
  const toggle = useMutation({
    mutationFn: (id: string) => api.post<{ saved: boolean }>(`/parcels/${id}/favorite`),
    onSuccess: ({ saved }, id) =>
      queryClient.setQueryData<string[]>(["favorites"], (prev = []) =>
        saved ? [...prev.filter((x) => x !== id), id] : prev.filter((x) => x !== id),
      ),
  });
  return {
    savedIds: signedIn ? data : [],
    toggleSaved: (id: string) => toggle.mutate(id),
  };
}

const parcelDetailOptions = (id: string | undefined) => ({
  queryKey: ["parcel", id],
  queryFn: async ({ signal }: { signal: AbortSignal }) =>
    mapApiParcel(await api.get<ApiParcel>(`/parcels/${id}`, signal)),
  enabled: !!id,
  staleTime: 60_000,
});

export function useParcel(id: string | undefined) {
  return useQuery(parcelDetailOptions(id));
}

/** Fetch full amenities only for plots explicitly opened in the comparison. */
export function useParcelDetails(ids: string[]) {
  return useQueries({ queries: ids.map(parcelDetailOptions) });
}
