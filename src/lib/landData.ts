export type LandStatus = "available" | "sold" | "reserved" | "verified" | "disputed";
export type ListingType = "sale" | "lease";
export type PostedBy = "owner" | "broker";

export interface LandParcel {
  id: string;
  title: string;
  parcelNumber: string;
  size: string;
  price: number; // KES (sale) or KES/year (lease)
  status: LandStatus;
  listingType: ListingType;
  postedBy: PostedBy;
  county: string;
  description: string;
  verified: boolean;
  seller: { name: string; phone: string; agency: string };
  amenities: {
    school: string;
    hospital: string;
    shopping: string;
    mainRoad: string;
    distanceToTarmac: string;
    utilities: string[];
    developmentScore: number;
  };
  polygon: [number, number][];
}

const parcel = (
  lat: number,
  lng: number,
  dLat = 0.0035,
  dLng = 0.0045,
  skew = 0.18,
): [number, number][] => {
  const sx = dLng * skew;
  const sy = dLat * skew;
  return [
    [lat - dLat + sy * 0.4, lng - dLng - sx * 0.2],
    [lat - dLat - sy * 0.6, lng + dLng + sx * 0.3],
    [lat + dLat - sy * 0.2, lng + dLng - sx * 0.5],
    [lat + dLat + sy * 0.5, lng - dLng + sx * 0.4],
  ];
};

export const landParcels: LandParcel[] = [
  {
    id: "LV-001",
    title: "Kitengela Prime Plot",
    parcelNumber: "KAJ/KTG/4521",
    size: "50 x 100 ft",
    price: 1850000,
    status: "available",
    listingType: "sale",
    postedBy: "broker",
    county: "Kajiado",
    description: "Prime residential plot in fast-growing Kitengela town with title deed ready.",
    verified: true,
    seller: { name: "Acacia Realty", phone: "+254 712 345 678", agency: "Acacia Realty Ltd" },
    amenities: {
      school: "Kitengela International — 1.2 km",
      hospital: "EPZ Medical Centre — 2.4 km",
      shopping: "Signature Mall — 1.8 km",
      mainRoad: "Namanga Road — 0.6 km",
      distanceToTarmac: "300 m",
      utilities: ["Water", "Electricity", "Fibre"],
      developmentScore: 86,
    },
    polygon: parcel(-1.4789, 36.9595),
  },
  {
    id: "LV-002",
    title: "Ruiru Verified Estate Block",
    parcelNumber: "KMB/RUR/8821",
    size: "1/8 Acre",
    price: 2400000,
    status: "verified",
    listingType: "sale",
    postedBy: "owner",
    county: "Kiambu",
    description: "Verified plot within a gated estate, perimeter wall complete.",
    verified: true,
    seller: { name: "James Mwangi", phone: "+254 722 998 112", agency: "Direct Owner" },
    amenities: {
      school: "Brookhouse Ruiru — 2.1 km",
      hospital: "Ruiru Level 4 — 3.0 km",
      shopping: "Spur Mall — 1.5 km",
      mainRoad: "Thika Superhighway — 1.1 km",
      distanceToTarmac: "0 m (on tarmac)",
      utilities: ["Water", "Electricity", "Sewer"],
      developmentScore: 92,
    },
    polygon: parcel(-1.1485, 36.9612, 0.004, 0.0052),
  },
  {
    id: "LV-003",
    title: "Athi River Industrial Parcel (Lease)",
    parcelNumber: "MCH/ATH/1207",
    size: "1/4 Acre",
    price: 720000,
    status: "available",
    listingType: "lease",
    postedBy: "broker",
    county: "Machakos",
    description: "Industrial-zoned parcel near EPZ available on long-term lease.",
    verified: true,
    seller: { name: "EPZ Holdings", phone: "+254 733 221 004", agency: "EPZ Holdings" },
    amenities: {
      school: "Daystar University — 4.5 km",
      hospital: "Shalom Hospital — 3.2 km",
      shopping: "Gateway Mall — 5.0 km",
      mainRoad: "Mombasa Road — 0.4 km",
      distanceToTarmac: "150 m",
      utilities: ["Water", "3-Phase Electricity"],
      developmentScore: 78,
    },
    polygon: parcel(-1.4536, 36.9783, 0.0055, 0.0072, 0.22),
  },
  {
    id: "LV-004",
    title: "Syokimau Sold Block",
    parcelNumber: "MCH/SYK/3398",
    size: "50 x 100 ft",
    price: 3200000,
    status: "sold",
    listingType: "sale",
    postedBy: "broker",
    county: "Machakos",
    description: "Recently transacted parcel — historical record.",
    verified: true,
    seller: { name: "Homes Kenya", phone: "+254 700 111 222", agency: "Homes Kenya" },
    amenities: {
      school: "Crawford International — 1.8 km",
      hospital: "Mater Syokimau — 2.0 km",
      shopping: "Gateway Mall — 1.2 km",
      mainRoad: "Mombasa Road — 0.9 km",
      distanceToTarmac: "200 m",
      utilities: ["Water", "Electricity"],
      developmentScore: 81,
    },
    polygon: parcel(-1.3712, 36.9402, 0.003, 0.004),
  },
  {
    id: "LV-005",
    title: "Ngong Disputed Parcel",
    parcelNumber: "KAJ/NGG/7702",
    size: "1/2 Acre",
    price: 4100000,
    status: "disputed",
    listingType: "sale",
    postedBy: "broker",
    county: "Kajiado",
    description: "Currently under boundary dispute — not transactable.",
    verified: false,
    seller: { name: "Pending Resolution", phone: "—", agency: "—" },
    amenities: {
      school: "Ngong Hills Academy — 2.7 km",
      hospital: "Ngong Sub-County Hospital — 3.4 km",
      shopping: "Ngong Town — 2.1 km",
      mainRoad: "Ngong Road — 1.4 km",
      distanceToTarmac: "600 m",
      utilities: ["Water"],
      developmentScore: 55,
    },
    polygon: parcel(-1.3543, 36.6534, 0.007, 0.009, 0.25),
  },
  {
    id: "LV-006",
    title: "Karen Premium Lot",
    parcelNumber: "NRB/KRN/0451",
    size: "1/2 Acre",
    price: 28500000,
    status: "available",
    listingType: "sale",
    postedBy: "broker",
    county: "Nairobi",
    description: "Premium serviced plot in leafy Karen suburb.",
    verified: true,
    seller: { name: "Knight Frank Kenya", phone: "+254 709 200 000", agency: "Knight Frank" },
    amenities: {
      school: "Brookhouse Karen — 1.0 km",
      hospital: "Karen Hospital — 1.6 km",
      shopping: "The Hub Karen — 2.2 km",
      mainRoad: "Langata Road — 0.7 km",
      distanceToTarmac: "0 m",
      utilities: ["Water", "Electricity", "Sewer", "Fibre"],
      developmentScore: 95,
    },
    polygon: parcel(-1.319, 36.706, 0.006, 0.008, 0.15),
  },
  {
    id: "LV-007",
    title: "Juja Farmstead",
    parcelNumber: "KMB/JJA/9921",
    size: "1 Acre",
    price: 6800000,
    status: "verified",
    listingType: "sale",
    postedBy: "owner",
    county: "Kiambu",
    description: "Verified agricultural parcel near JKUAT.",
    verified: true,
    seller: { name: "Peter Kariuki", phone: "+254 711 882 110", agency: "Direct Owner" },
    amenities: {
      school: "JKUAT — 1.9 km",
      hospital: "AIC Kijabe Annex — 3.6 km",
      shopping: "Juja City Mall — 2.4 km",
      mainRoad: "Thika Superhighway — 1.0 km",
      distanceToTarmac: "100 m",
      utilities: ["Water", "Electricity"],
      developmentScore: 74,
    },
    polygon: parcel(-1.1018, 37.0144, 0.0085, 0.011, 0.2),
  },
  {
    id: "LV-008",
    title: "Thika Greens Plot",
    parcelNumber: "KMB/THK/6610",
    size: "50 x 100 ft",
    price: 1450000,
    status: "available",
    listingType: "sale",
    postedBy: "owner",
    county: "Kiambu",
    description: "Affordable plot near Thika Greens Golf Resort.",
    verified: true,
    seller: { name: "Mary Wambui", phone: "+254 720 445 117", agency: "Direct Owner" },
    amenities: {
      school: "Mt. Kenya University — 5.0 km",
      hospital: "Thika Level 5 — 6.2 km",
      shopping: "Thika Road Mall — 7.5 km",
      mainRoad: "Garissa Road — 0.9 km",
      distanceToTarmac: "400 m",
      utilities: ["Water", "Electricity"],
      developmentScore: 70,
    },
    polygon: parcel(-1.0374, 37.131, 0.004, 0.0052),
  },
  {
    id: "LV-009",
    title: "Konza Tech City Lease Plot",
    parcelNumber: "MCH/KNZ/0099",
    size: "1 Acre",
    price: 480000,
    status: "available",
    listingType: "lease",
    postedBy: "broker",
    county: "Machakos",
    description: "Long-term commercial lease near Konza Technopolis development.",
    verified: true,
    seller: { name: "Konza Land Brokers", phone: "+254 733 909 200", agency: "Konza Land Brokers" },
    amenities: {
      school: "Konza University — 4.2 km",
      hospital: "Malili Health Centre — 5.0 km",
      shopping: "Malili Town — 3.5 km",
      mainRoad: "Mombasa Road — 0.5 km",
      distanceToTarmac: "0 m",
      utilities: ["Water", "Electricity", "Fibre"],
      developmentScore: 83,
    },
    polygon: parcel(-1.7423, 37.115, 0.009, 0.0115, 0.22),
  },
  {
    id: "LV-010",
    title: "Kiserian Hillside Plot",
    parcelNumber: "KAJ/KSR/3344",
    size: "1/4 Acre",
    price: 2100000,
    status: "available",
    listingType: "sale",
    postedBy: "owner",
    county: "Kajiado",
    description: "Scenic hillside plot with views of the Rift Valley.",
    verified: true,
    seller: { name: "John Saitoti", phone: "+254 714 332 005", agency: "Direct Owner" },
    amenities: {
      school: "Kiserian Academy — 1.4 km",
      hospital: "AIC Kijabe Annex — 8.0 km",
      shopping: "Kiserian Town — 1.1 km",
      mainRoad: "Magadi Road — 0.6 km",
      distanceToTarmac: "200 m",
      utilities: ["Water", "Electricity"],
      developmentScore: 68,
    },
    polygon: parcel(-1.4198, 36.6829, 0.005, 0.0065, 0.2),
  },
];

export const statusMeta: Record<LandStatus, { label: string; color: string; fill: string }> = {
  available: { label: "Available", color: "#2563EB", fill: "#2563EB" },
  sold: { label: "Sold", color: "#64748B", fill: "#64748B" },
  reserved: { label: "Reserved", color: "#D97706", fill: "#D97706" },
  verified: { label: "Verified", color: "#16A34A", fill: "#16A34A" },
  disputed: { label: "Disputed", color: "#DC2626", fill: "#DC2626" },
};

export const counties = ["All", "Nairobi", "Kiambu", "Kajiado", "Machakos"];

export type RentalType = "Apartment" | "House" | "Commercial" | "Townhouse" | "Studio";

export interface Rental {
  id: string;
  title: string;
  type: RentalType;
  price: number;
  bedrooms: number;
  county: string;
  area: string;
  postedBy: PostedBy;
  agent: { name: string; phone: string };
  position: [number, number];
}

export const rentals: Rental[] = [
  {
    id: "R-1",
    title: "Kilimani 2BR Apartment",
    type: "Apartment",
    price: 75000,
    bedrooms: 2,
    county: "Nairobi",
    area: "Kilimani",
    postedBy: "broker",
    agent: { name: "Urban Stays", phone: "+254 712 010 200" },
    position: [-1.2921, 36.7836],
  },
  {
    id: "R-2",
    title: "Westlands Studio",
    type: "Studio",
    price: 55000,
    bedrooms: 1,
    county: "Nairobi",
    area: "Westlands",
    postedBy: "owner",
    agent: { name: "Aisha N.", phone: "+254 720 554 100" },
    position: [-1.2649, 36.8025],
  },
  {
    id: "R-3",
    title: "Karen 4BR Townhouse",
    type: "Townhouse",
    price: 220000,
    bedrooms: 4,
    county: "Nairobi",
    area: "Karen",
    postedBy: "broker",
    agent: { name: "Knight Frank", phone: "+254 709 200 000" },
    position: [-1.319, 36.706],
  },
  {
    id: "R-4",
    title: "Ruiru Office Space",
    type: "Commercial",
    price: 180000,
    bedrooms: 0,
    county: "Kiambu",
    area: "Ruiru",
    postedBy: "broker",
    agent: { name: "Greenfield", phone: "+254 722 998 112" },
    position: [-1.1485, 36.9612],
  },
  {
    id: "R-5",
    title: "Syokimau Family Home",
    type: "House",
    price: 95000,
    bedrooms: 3,
    county: "Machakos",
    area: "Syokimau",
    postedBy: "owner",
    agent: { name: "Daniel Mutua", phone: "+254 733 221 988" },
    position: [-1.3712, 36.9402],
  },
  {
    id: "R-6",
    title: "Lavington Penthouse",
    type: "Apartment",
    price: 320000,
    bedrooms: 4,
    county: "Nairobi",
    area: "Lavington",
    postedBy: "broker",
    agent: { name: "Hass Consult", phone: "+254 709 435 000" },
    position: [-1.2792, 36.7669],
  },
  {
    id: "R-7",
    title: "Kileleshwa 3BR House",
    type: "House",
    price: 145000,
    bedrooms: 3,
    county: "Nairobi",
    area: "Kileleshwa",
    postedBy: "owner",
    agent: { name: "Grace W.", phone: "+254 711 030 400" },
    position: [-1.2837, 36.7777],
  },
  {
    id: "R-8",
    title: "Runda Family House",
    type: "House",
    price: 280000,
    bedrooms: 5,
    county: "Nairobi",
    area: "Runda",
    postedBy: "broker",
    agent: { name: "Pam Golding", phone: "+254 709 100 000" },
    position: [-1.2236, 36.8217],
  },
  {
    id: "R-9",
    title: "Juja 2BR Apartment",
    type: "Apartment",
    price: 28000,
    bedrooms: 2,
    county: "Kiambu",
    area: "Juja",
    postedBy: "owner",
    agent: { name: "Samuel K.", phone: "+254 720 776 002" },
    position: [-1.1018, 37.0144],
  },
];
