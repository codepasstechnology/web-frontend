import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { formatPrice, mapApiProperty } from "@/lib/properties";

const mockUsePublicProperties = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (opts: unknown) => opts,
  useNavigate: () => vi.fn(),
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));

vi.mock("@/lib/properties", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/properties")>();
  return { ...actual, usePublicProperties: () => mockUsePublicProperties() };
});

vi.mock("@/components/LandMap", () => ({
  LandMap: () => <div data-testid="land-map" />,
}));

vi.mock("@/components/PropertyPanel", () => ({
  RentalPanel: () => <div data-testid="rental-panel" />,
}));

const { RentalsPage } = await import("../routes/rentals").then(async (m) => ({
  RentalsPage: (m.Route as unknown as { component: () => React.ReactElement }).component,
}));

const apiProperty = {
  id: "p-1",
  reference_number: "PRP-ABC12345",
  title: "Kilimani 2BR Apartment",
  description: "Bright corner unit",
  county: "Nairobi",
  area: "Kilimani",
  intent: "rent" as const,
  type: "apartment" as const,
  price: 75000,
  price_period: "month" as const,
  min_nights: null,
  cleaning_fee: null,
  bedrooms: 2,
  bathrooms: 1,
  furnished: true,
  amenities: ["Water", "Parking"],
  posted_by: "owner" as const,
  agent_name: "Jane Mwangi",
  agent_phone: "+254700000001",
  agent_agency: "",
  latitude: -1.2921,
  longitude: 36.7836,
  photos: ["https://example.test/one.jpg"],
  featured: false,
};

describe("mapApiProperty", () => {
  it("maps the API shape onto the client shape", () => {
    const p = mapApiProperty(apiProperty);

    expect(p.reference).toBe("PRP-ABC12345");
    expect(p.pricePeriod).toBe("month");
    expect(p.position).toEqual([-1.2921, 36.7836]);
    expect(p.amenities).toEqual(["Water", "Parking"]);
    expect(p.agent.name).toBe("Jane Mwangi");
  });

  it("falls back to a dash when the contact fields are blank", () => {
    const p = mapApiProperty({ ...apiProperty, agent_name: "", agent_phone: "" });

    expect(p.agent.name).toBe("—");
    expect(p.agent.phone).toBe("—");
  });
});

describe("formatPrice", () => {
  it("labels a rental per month", () => {
    expect(formatPrice(75000, "month")).toBe("KES 75,000 / month");
  });

  it("labels a short stay per night", () => {
    expect(formatPrice(4500, "night")).toBe("KES 4,500 / night");
  });

  it("leaves a sale price unqualified", () => {
    expect(formatPrice(8500000, "total")).toBe("KES 8,500,000");
  });
});

describe("RentalsPage", () => {
  beforeEach(() => {
    mockUsePublicProperties.mockReset();
  });

  it("renders listings returned by the API", () => {
    mockUsePublicProperties.mockReturnValue({
      data: [mapApiProperty(apiProperty)],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<RentalsPage />);

    expect(screen.getByText("Kilimani 2BR Apartment")).toBeInTheDocument();
    expect(screen.getByText("KES 75,000 / month")).toBeInTheDocument();
    expect(screen.getByText("1 listings")).toBeInTheDocument();
  });

  it("shows a loading state while the feed is in flight", () => {
    mockUsePublicProperties.mockReturnValue({
      data: [],
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    });

    render(<RentalsPage />);

    expect(screen.getByText("Loading listings…")).toBeInTheDocument();
  });

  it("offers a retry when the feed fails", () => {
    const refetch = vi.fn();
    mockUsePublicProperties.mockReturnValue({
      data: [],
      isLoading: false,
      isError: true,
      refetch,
    });

    render(<RentalsPage />);

    expect(screen.getByText("Could not load listings.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });

  it("explains an empty result set rather than rendering nothing", () => {
    mockUsePublicProperties.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<RentalsPage />);

    expect(screen.getByText("No properties match these filters yet.")).toBeInTheDocument();
  });
});
