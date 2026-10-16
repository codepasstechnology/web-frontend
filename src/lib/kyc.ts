import { useQuery } from "@tanstack/react-query";
import { api } from "./api";

export interface KycDocument {
  id: string;
  type: string;
  original_name: string;
  mime_type: string | null;
  size: number | null;
  verification_status: string;
}

export interface KycApplication {
  id: string;
  reference: string;
  status: string;
  document_type: string | null;
  reviewer_notes: string | null;
  rejection_reason: string | null;
  info_request_message: string | null;
  correction_note: string | null;
  user_reply: string | null;
  user_replied_at: string | null;
  user_reply_document_path: string | null;
  user_reply_document_name: string | null;
  admin_acknowledgment: string | null;
  admin_acknowledged_at: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  created_at: string;
  parcel: {
    id: string;
    title: string;
    parcel_number: string | null;
    latitude: number | null;
    longitude: number | null;
    boundary: { lat: number; lng: number }[] | null;
    boundary_source: string | null;
  } | null;
  documents: KycDocument[];
}

export const KYC_KEY = ["kyc"];

export function useKycApplications() {
  return useQuery({
    queryKey: KYC_KEY,
    queryFn: () => api.get<KycApplication[]>("/user/kyc"),
    staleTime: 60_000,
  });
}

/** An application waiting on the user: an unanswered info request or a location fix. */
export const needsUserAction = (a: KycApplication) =>
  (a.status === "info_requested" && !a.user_reply && !a.user_reply_document_path) ||
  a.status === "location_correction_requested";

export const DOC_TYPES = [
  { value: "national_id", label: "National ID" },
  { value: "title_deed", label: "Title Deed" },
  { value: "mutation", label: "Mutation Form" },
  { value: "lease_agreement", label: "Lease Agreement" },
  { value: "certificate_of_occupancy", label: "Certificate of Occupancy" },
  { value: "survey_map", label: "Survey Map" },
  { value: "other", label: "Other" },
];

/** Every KYC application and new land listing needs both of these. */
export const REQUIRED_DOCS = [
  { value: "national_id", label: "National ID" },
  { value: "title_deed", label: "Title Deed" },
];
