export type PlanId = "free" | "basic" | "pro";

export interface Plan {
  id: PlanId;
  name: string;
  price: number; // KES / month
  listings: number; // Infinity for pro
  photos: number;
  cta: string;
  badge?: { label: string; color: "accent" | "primary" };
  features: string[];
}

export const plans: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    listings: 1,
    photos: 3,
    cta: "Get Started",
    features: [
      "1 active listing",
      "3 photos per listing",
      "Standard map visibility",
      "Basic property details",
      "Email support",
    ],
  },
  {
    id: "basic",
    name: "Basic",
    price: 700,
    listings: 5,
    photos: 10,
    cta: "Start Basic",
    badge: { label: "Most Popular", color: "accent" },
    features: [
      "5 active listings",
      "10 photos per listing",
      "Standard map visibility",
      "WhatsApp contact button",
      "Listing performance stats",
      "Priority email support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 4500,
    listings: Infinity,
    photos: 20,
    cta: "Go Pro",
    badge: { label: "Pro", color: "primary" },
    features: [
      "Unlimited active listings",
      "20 photos per listing",
      "Featured map placement",
      "Verified Seller badge",
      "Advanced analytics dashboard",
      "Boosted in search results",
      "WhatsApp + phone contact",
      "Dedicated support",
    ],
  },
];

export const addOns = [
  { id: "boost", name: "Boost Listing to Top", price: 300, period: "7 days" },
  { id: "featured", name: "Featured Badge", price: 500, period: "30 days" },
];

export const planById = (id: PlanId) => plans.find((p) => p.id === id)!;

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
