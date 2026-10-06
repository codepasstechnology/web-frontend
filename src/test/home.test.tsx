import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ParcelSummary } from "@/lib/parcels";
import type { Property } from "@/lib/properties";

const navigate = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigate,
  Link: React.forwardRef<
    HTMLAnchorElement,
    { to: string; search?: unknown } & React.ComponentProps<"a">
  >(({ to, search: _s, onClick, ...rest }, ref) => (
    <a
      ref={ref}
      href={to}
      {...rest}
      onClick={(e) => {
        e.preventDefault();
        onClick?.(e);
      }}
    />
  )),
}));

const parcels: { data: ParcelSummary[] } = { data: [] };
const properties: { data: Property[] } = { data: [] };

vi.mock("@/lib/parcels", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/parcels")>();
  return { ...actual, usePublicParcels: () => ({ data: parcels.data }) };
});

vi.mock("@/lib/auth", () => ({ useAuth: () => ({ user: null }) }));

vi.mock("@/lib/properties", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/properties")>();
  return { ...actual, usePublicProperties: () => ({ data: properties.data }) };
});

const { HomePage } = await import("@/components/home/HomePage");

const parcel: ParcelSummary = {
  id: "p1",
  parcelNumber: "LR-4471",
  county: "Kajiado",
  price: 3500000,
  listingType: "sale",
  verified: true,
  featured: true,
  coverPhotoUrl: null,
};

const rental: Property = {
  id: "r1",
  reference: "PR-1",
  title: "2-bedroom apartment",
  description: "",
  county: "Nairobi",
  area: "Kilimani",
  intent: "rent",
  type: "apartment",
  price: 85000,
  pricePeriod: "month",
  minNights: null,
  cleaningFee: null,
  bedrooms: 2,
  bathrooms: 2,
  furnished: false,
  amenities: [],
  postedBy: "owner",
  agent: { name: "", phone: "", agency: "" },
  position: [-1.29, 36.8],
  photos: [],
  featured: false,
};

describe("Home page", () => {
  beforeEach(() => {
    navigate.mockClear();
    parcels.data = [];
    properties.data = [];
  });

  it("links to the rest of the site from the navbar", () => {
    render(<HomePage />);
    const nav = screen.getByRole("navigation", { name: "Main" });
    for (const label of [
      "Pricing",
      "Blog",
      "About",
      "Help Centre",
      "Contact",
      "Login",
      "Register",
    ]) {
      expect(within(nav).getByRole("link", { name: label })).toBeInTheDocument();
    }
  });

  it("renders the hero headline and the scroll story", () => {
    render(<HomePage />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Every plot,pinned to the ground.",
    );
    expect(screen.getByRole("heading", { name: "The whole country, mapped." })).toBeInTheDocument();
  });

  it("opens the mobile menu and closes it when a link is tapped", async () => {
    const user = userEvent.setup();
    render(<HomePage />);
    const toggle = screen.getByRole("button", { name: "Open menu" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    const menu = document.getElementById("gp-menu");
    expect(menu).not.toBeNull();

    await user.click(within(menu as HTMLElement).getByRole("button", { name: "Pin Properties" }));
    await user.click(within(menu as HTMLElement).getByRole("link", { name: /Land/ }));
    expect(document.getElementById("gp-menu")).toBeNull();
    expect(screen.getByRole("button", { name: "Open menu" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("changes the search placeholder with the selected tab", async () => {
    const user = userEvent.setup();
    render(<HomePage />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("placeholder", "County, town or parcel number");

    await user.click(screen.getByRole("tab", { name: "Rentals" }));
    expect(input).toHaveAttribute("placeholder", "Where do you want to live?");
    expect(screen.getByRole("tab", { name: "Rentals" })).toHaveAttribute("aria-selected", "true");
  });

  it("sends the search to the page for the selected tab", async () => {
    const user = userEvent.setup();
    render(<HomePage />);
    await user.click(screen.getByRole("tab", { name: "Homes" }));
    await user.click(screen.getByRole("button", { name: "Search" }));
    expect(navigate).toHaveBeenCalledWith({ to: "/rentals" });
  });

  it("shows real listings from the API and links each to its map", () => {
    parcels.data = [parcel];
    properties.data = [rental];
    render(<HomePage />);

    expect(screen.getByRole("heading", { name: "Fresh on the map." })).toBeInTheDocument();
    expect(screen.getByText("2-bedroom apartment").closest("a")).toHaveAttribute(
      "href",
      "/rentals",
    );
    expect(screen.getByText("Parcel LR-4471").closest("a")).toHaveAttribute("href", "/land");
    expect(screen.getByText("KES 85,000 / month")).toBeInTheDocument();
  });

  it("hides the listings section when there is nothing to show", () => {
    render(<HomePage />);
    expect(screen.queryByRole("heading", { name: "Fresh on the map." })).not.toBeInTheDocument();
  });

  it("shows the verified parcel card in the scroll story", () => {
    parcels.data = [parcel];
    render(<HomePage />);
    expect(screen.getByText("Verified")).toBeInTheDocument();
    expect(screen.getByText("KES 3,500,000 · Message the owner")).toBeInTheDocument();
  });
});
