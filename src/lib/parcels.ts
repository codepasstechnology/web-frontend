import { useQuery } from "@tanstack/react-query";
import { api } from "./api";
import type { LandParcel, LandStatus } from "./landData";

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
  seller_name: string;
  seller_phone: string;
  seller_agency: string;
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

export function mapApiParcel(p: ApiParcel): LandParcel {
  return {
    id: p.id,
    title: p.parcel_number,
    parcelNumber: p.parcel_number,
    size: p.size || "—",
    price: p.price,
    status: (p.status === "verified" ? "verified" : "available") as LandStatus,
    listingType: p.listing_type,
    postedBy: p.posted_by,
    county: p.county,
    description: p.description || "",
    verified: p.verified,
    featured: p.featured,
    photos: p.photos ?? [],
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
      utilities: p.amenities?.utilities ?? [],
      developmentScore: p.amenities?.development_score ?? 0,
    },
    polygon:
      p.boundary && p.boundary.length >= 3
        ? p.boundary.map((v): [number, number] => [Number(v.lat), Number(v.lng)])
        : undefined,
    latitude: p.latitude != null ? Number(p.latitude) : undefined,
    longitude: p.longitude != null ? Number(p.longitude) : undefined,
  };
}

/** Full parcels, with boundaries and seller details, for the map pages. */
export function useMapParcels() {
  return useQuery({
    queryKey: ["parcels", "map"],
    queryFn: async () => (await api.get<ApiParcel[]>("/parcels")).map(mapApiParcel),
    staleTime: 60_000,
  });
}
