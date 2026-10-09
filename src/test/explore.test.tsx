import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { LandParcel } from "@/lib/landData";
import type { Property } from "@/lib/properties";

const mockNavigate = vi.fn();
const mockSearch = vi.fn(() => ({}));
const mockToggleSaved = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (opts: object) => ({ ...opts, useSearch: () => mockSearch() }),
  useNavigate: () => mockNavigate,
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));

vi.mock("@/components/home/HomeNavbar", () => ({ HomeNavbar: () => null }));
vi.mock("@/components/LandMap", () => ({
  LandMap: ({ parcels, properties }: { parcels: unknown[]; properties: unknown[] }) => (
    <div data-testid="map">
      {parcels.length} parcels, {properties.length} properties
    </div>
  ),
}));
vi.mock("@/components/PropertyPanel", () => ({
  ParcelPanel: ({ parcel, onToggleSaved }: { parcel: LandParcel; onToggleSaved: () => void }) => (
    <aside>
      Parcel {parcel.parcelNumber}
      <button type="button" onClick={onToggleSaved}>
        Save
      </button>
    </aside>
  ),
  RentalPanel: ({ property }: { property: Property }) => <aside>Rental {property.title}</aside>,
}));
vi.mock("@/lib/auth", () => ({ useAuth: () => ({ user: { id: "u1" } }) }));
vi.mock("@/lib/api", () => ({ api: { post: vi.fn(() => Promise.resolve()) } }));

const parcel = {
  id: "a",
  parcelNumber: "KAJ/1",
  county: "Kajiado",
  size: "1/8 acre",
  price: 100,
  listingType: "sale",
  status: "available",
  latitude: -1,
  longitude: 36,
  photos: [],
} as unknown as LandParcel;
const property = {
  id: "b",
  title: "Kilimani 2BR",
  county: "Nairobi",
  area: "Kilimani",
  intent: "rent",
  type: "apartment",
  bedrooms: 2,
  price: 45000,
  pricePeriod: "month",
  position: [-1.3, 36.8],
  photos: [],
} as unknown as Property;

const query = <T,>(data: T[]) => ({
  data,
  isLoading: false,
  isError: false,
  isFetching: false,
  isPlaceholderData: false,
  refetch: vi.fn(),
});

vi.mock("@/lib/parcels", () => ({
  useMapParcels: () => query([parcel]),
  useSavedParcels: () => ({ savedIds: [], toggleSaved: mockToggleSaved }),
}));
vi.mock("@/lib/properties", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/properties")>()),
  usePublicProperties: () => query([property]),
  useProperty: () => ({ data: undefined }),
}));

const { Route } = await import("@/routes/explore");
const ExplorePage = (Route as unknown as { component: React.ComponentType }).component;

describe("Explore map", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearch.mockReturnValue({});
  });

  it("puts land and rentals on one map by default", async () => {
    render(<ExplorePage />);
    expect(await screen.findByTestId("map")).toHaveTextContent("1 parcels, 1 properties");
    expect(screen.getByRole("button", { name: "Land 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Rentals 1" })).toBeInTheDocument();
  });

  it("narrows to one kind from the URL", async () => {
    mockSearch.mockReturnValue({ show: "land" });
    const { unmount } = render(<ExplorePage />);
    expect(await screen.findByTestId("map")).toHaveTextContent("1 parcels, 0 properties");
    expect(screen.getByRole("button", { name: "Land 1" })).toHaveAttribute("aria-pressed", "true");
    unmount();

    mockSearch.mockReturnValue({ show: "rentals" });
    render(<ExplorePage />);
    expect(await screen.findByTestId("map")).toHaveTextContent("0 parcels, 1 properties");
  });

  it("writes the chosen kind to the URL", async () => {
    render(<ExplorePage />);
    await userEvent.click(screen.getByRole("button", { name: "Rentals 1" }));
    expect(mockNavigate).toHaveBeenCalledWith(expect.objectContaining({ to: "/explore" }));
    const { search } = mockNavigate.mock.calls[0][0] as {
      search: (p: object) => object;
    };
    expect(search({})).toEqual({ show: "rentals" });
  });

  it("lists both kinds in the side panel and opens the one tapped", async () => {
    render(<ExplorePage />);
    const list = within(screen.getByRole("list", { name: "Listings" }));
    expect(list.getByText("KAJ/1")).toBeInTheDocument();
    expect(list.getByText("Kilimani 2BR")).toBeInTheDocument();

    await userEvent.click(list.getByText("Kilimani 2BR"));
    const { search } = mockNavigate.mock.calls[0][0] as { search: (p: object) => object };
    expect(search({})).toEqual({ property: "b", parcel: undefined });
  });

  it("opens the panel for the listing named in the URL", () => {
    mockSearch.mockReturnValue({ property: "b" });
    render(<ExplorePage />);
    expect(screen.getByText("Rental Kilimani 2BR")).toBeInTheDocument();
  });

  it("saves a parcel from the panel instead of sending the viewer to /land", async () => {
    mockSearch.mockReturnValue({ parcel: "a" });
    render(<ExplorePage />);

    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(mockToggleSaved).toHaveBeenCalledWith("a");
    expect(mockNavigate).not.toHaveBeenCalledWith(expect.objectContaining({ to: "/land" }));
  });
});
