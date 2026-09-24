import { useQuery } from "@tanstack/react-query";
import { api } from "./api";

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
