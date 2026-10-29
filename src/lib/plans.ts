import { useQuery } from "@tanstack/react-query";
import { api } from "./api";

export interface Plan {
  id: string;
  name: string;
  price: number; // KES / month
  priceYearly: number | null;
  listings: number; // Infinity for unlimited
  photos: number;
  documents: number;
  cta: string;
  badge?: { label: string; color: "accent" | "primary" };
  features: string[];
  audience?: "individual" | "agency";
}

interface ApiPlan {
  id: string;
  name: string;
  slug: string;
  price_monthly: number;
  price_yearly: number | null;
  currency: string;
  max_listings: number;
  max_photos: number;
  max_documents: number;
  badge_label: string | null;
  features: string[];
  audience?: "individual" | "agency";
}

function mapApiPlan(p: ApiPlan): Plan {
  return {
    id: p.slug,
    name: p.name,
    price: p.price_monthly,
    priceYearly: p.price_yearly,
    listings: p.max_listings === -1 ? Infinity : p.max_listings,
    photos: p.max_photos,
    documents: p.max_documents,
    cta: `Choose ${p.name}`,
    badge: p.badge_label ? { label: p.badge_label, color: "accent" } : undefined,
    features: p.features,
    audience: p.audience ?? "individual",
  };
}

/** The plans an account can pick: agency plans for agency members, individual plans for everyone else. */
export function plansFor(plans: Plan[], agency: boolean): Plan[] {
  return plans.filter((p) => (p.audience === "agency") === agency);
}

/** The plan an account drops to without a paid subscription: Agency Free or Free. */
export function freePlanFor(plans: Plan[], agency: boolean): Plan | undefined {
  return plansFor(plans, agency).find((p) => p.price === 0);
}

export function usePlans() {
  return useQuery({
    queryKey: ["plans"],
    queryFn: async () => (await api.get<ApiPlan[]>("/plans")).map(mapApiPlan),
    staleTime: 5 * 60_000,
  });
}

export const addOns = [
  { id: "boost", name: "Boost Listing to Top", price: 300, period: "7 days" },
  { id: "featured", name: "Featured Badge", price: 500, period: "30 days" },
];

export const kenyaCounties = [
  "Mombasa",
  "Kwale",
  "Kilifi",
  "Tana River",
  "Lamu",
  "Taita-Taveta",
  "Garissa",
  "Wajir",
  "Mandera",
  "Marsabit",
  "Isiolo",
  "Meru",
  "Tharaka-Nithi",
  "Embu",
  "Kitui",
  "Machakos",
  "Makueni",
  "Nyandarua",
  "Nyeri",
  "Kirinyaga",
  "Murang'a",
  "Kiambu",
  "Turkana",
  "West Pokot",
  "Samburu",
  "Trans Nzoia",
  "Uasin Gishu",
  "Elgeyo-Marakwet",
  "Nandi",
  "Baringo",
  "Laikipia",
  "Nakuru",
  "Narok",
  "Kajiado",
  "Kericho",
  "Bomet",
  "Kakamega",
  "Vihiga",
  "Bungoma",
  "Busia",
  "Siaya",
  "Kisumu",
  "Homa Bay",
  "Migori",
  "Kisii",
  "Nyamira",
  "Nairobi",
];
