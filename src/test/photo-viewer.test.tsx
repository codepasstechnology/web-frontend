import React from "react";
import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Property } from "@/lib/properties";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));
vi.mock("@/lib/auth", () => ({ useAuth: () => ({ user: null }) }));
vi.mock("@/lib/api", () => ({ api: { post: vi.fn() } }));

const { RentalPanel } = await import("@/components/PropertyPanel");

const property = {
  id: "b",
  title: "Kilimani 2BR",
  county: "Nairobi",
  area: "Kilimani",
  intent: "rent",
  type: "apartment",
  price: 45000,
  pricePeriod: "month",
  bedrooms: 2,
  bathrooms: 1,
  furnished: false,
  amenities: [],
  postedBy: "owner",
  agent: { name: "A", phone: "0700", agency: "" },
  position: [-1.3, 36.8],
  photos: ["/a.jpg", "/b.jpg", "/c.jpg"],
  featured: false,
} as unknown as Property;

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

describe("Listing photo viewer", () => {
  it("opens full screen from the panel photo and pages through every photo", async () => {
    render(<RentalPanel property={property} onClose={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: "View photo 1 of 3" }));
    const viewer = within(screen.getByRole("dialog", { name: "Kilimani 2BR photos" }));
    expect(viewer.getByText("1 / 3")).toBeInTheDocument();
    expect(viewer.getAllByRole("img", { name: /Kilimani 2BR, photo/ })).toHaveLength(3);

    await userEvent.click(viewer.getByRole("button", { name: "Show photo 3" }));
    expect(viewer.getByRole("button", { name: "Show photo 3" })).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  it("closes on Escape and leaves the panel open", async () => {
    render(<RentalPanel property={property} onClose={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: "View photo 1 of 3" }));
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("Kilimani 2BR")).toBeInTheDocument();
  });

  it("opens on the photo currently shown in the panel", async () => {
    render(<RentalPanel property={property} onClose={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: "Next photo" }));
    await userEvent.click(screen.getByRole("button", { name: "View photo 2 of 3" }));
    expect(within(screen.getByRole("dialog")).getByText("2 / 3")).toBeInTheDocument();
  });
});
