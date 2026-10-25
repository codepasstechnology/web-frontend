import React from "react";
import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import { mapApiParcel, type ApiParcel } from "@/lib/parcels";
import { mapApiProperty, type ApiProperty } from "@/lib/properties";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));
vi.mock("@/lib/auth", () => ({ useAuth: () => ({ user: null }) }));
vi.mock("@/lib/api", () => ({ api: { post: vi.fn() }, API_BASE: "/api" }));

const { ParcelPanel, RentalPanel } = await import("@/components/PropertyPanel");

beforeAll(() => {
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
  })) as unknown as typeof window.matchMedia;
  globalThis.IntersectionObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof IntersectionObserver;
});

describe("an incomplete parcel response", () => {
  it("falls back to safe defaults instead of undefined", () => {
    const p = mapApiParcel({ id: "x" } as ApiParcel);

    expect(p.parcelNumber).toBe("");
    expect(p.price).toBe(0);
    expect(p.listingType).toBe("sale");
    expect(p.postedBy).toBe("owner");
    expect(p.county).toBe("");
    expect(p.photos).toEqual([]);
    expect(p.polygon).toBeUndefined();
  });

  it("ignores fields that arrive with the wrong type", () => {
    const p = mapApiParcel({
      id: "x",
      price: "not-a-number",
      boundary: "not-a-boundary",
      photos: "photo.jpg",
      listing_type: "rent",
      amenities: { utilities: "Water" },
    } as unknown as ApiParcel);

    expect(p.price).toBe(0);
    expect(p.polygon).toBeUndefined();
    expect(p.photos).toEqual([]);
    expect(p.listingType).toBe("sale");
    expect(p.amenities.utilities).toEqual([]);
  });

  it("still renders the details panel", () => {
    const parcel = mapApiParcel({ id: "x", latitude: -1.3, longitude: 36.8 } as ApiParcel);

    render(<ParcelPanel parcel={parcel} onClose={vi.fn()} saved={false} onToggleSaved={vi.fn()} />);

    expect(screen.getByRole("complementary", { name: "Listing details" })).toBeInTheDocument();
    expect(screen.getAllByText(/KES 0/).length).toBeGreaterThan(0);
  });
});

describe("an incomplete rental response", () => {
  it("falls back to safe defaults instead of undefined", () => {
    const p = mapApiProperty({
      id: "p",
      amenities: "wifi",
      photos: null,
    } as unknown as ApiProperty);

    expect(p.title).toBe("");
    expect(p.reference).toBe("");
    expect(p.price).toBe(0);
    expect(p.amenities).toEqual([]);
    expect(p.photos).toEqual([]);
  });

  it("still renders the details panel", () => {
    const property = mapApiProperty({
      id: "p",
      intent: "rent",
      type: "apartment",
      latitude: -1.3,
      longitude: 36.8,
    } as unknown as ApiProperty);

    render(<RentalPanel property={property} onClose={vi.fn()} />);

    expect(screen.getByRole("complementary", { name: "Listing details" })).toBeInTheDocument();
    expect(screen.getAllByText(/KES 0/).length).toBeGreaterThan(0);
  });
});
