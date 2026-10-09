import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { LandParcel } from "@/lib/landData";

const mockSearch = vi.fn(() => ({}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (opts: object) => ({ ...opts, useSearch: () => mockSearch() }),
  useNavigate: () => vi.fn(),
  Link: ({
    to,
    children,
    className,
  }: {
    to: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}));
vi.mock("@/components/home/HomeNavbar", () => ({ HomeNavbar: () => null }));
vi.mock("@/components/LandMap", () => ({ LandMap: () => <div data-testid="map" /> }));
vi.mock("@/lib/auth", () => ({ useAuth: () => ({ user: null }) }));
vi.mock("@/lib/api", () => ({ api: { post: vi.fn(() => Promise.resolve()) }, API_BASE: "/api" }));

const makeParcel = (id: string, over: Partial<LandParcel> = {}): LandParcel => ({
  id,
  title: `KAJ/${id}`,
  parcelNumber: `KAJ/${id}`,
  size: "1/8 acre",
  price: 1_450_000,
  status: "available",
  listingType: "sale",
  postedBy: "owner",
  county: "Kajiado",
  area: "Kitengela",
  description: "",
  verified: false,
  seller: { name: "Jane", phone: "0712345678", agency: "" },
  amenities: {
    school: "1.2 km",
    hospital: "3.4 km",
    shopping: "0.9 km",
    mainRoad: "0.4 km",
    distanceToTarmac: "0.4 km",
    utilities: ["Water"],
    developmentScore: 0,
  },
  latitude: -1.49175,
  longitude: 36.98848,
  photos: [],
  ...over,
});

const square: [number, number][] = [
  [-1.4917, 36.9884],
  [-1.4917, 36.9886],
  [-1.4919, 36.9886],
  [-1.4919, 36.9884],
];

const listed = ["1", "2", "3", "4"].map((id) => makeParcel(id, { polygon: square }));
vi.mock("@/lib/parcels", () => ({
  useMapParcels: () => ({
    data: listed,
    isLoading: false,
    isError: false,
    isFetching: false,
    isPlaceholderData: false,
    refetch: vi.fn(),
  }),
  useSavedParcels: () => ({ savedIds: [], toggleSaved: vi.fn() }),
}));

const { ParcelPanel } = await import("@/components/PropertyPanel");
const { ListingCard } = await import("@/components/map/ListingCard");
const { CompareTray, CompareModal } = await import("@/components/map/Compare");
const { Route } = await import("@/routes/land");
const LandPage = (Route as unknown as { component: React.ComponentType }).component;

const panel = (parcel: LandParcel) =>
  render(
    <div className="gm-mapwrap">
      <ParcelPanel parcel={parcel} onClose={vi.fn()} saved={false} onToggleSaved={vi.fn()} />
    </div>,
  );

describe("listing panel", () => {
  it("says the location is approximate when the seller only dropped a pin", () => {
    panel(makeParcel("a"));
    expect(screen.getByText(/Approximate location\. The seller dropped a pin/)).toBeInTheDocument();
  });

  it("has no approximate note for a traced plot", () => {
    panel(makeParcel("a", { polygon: square }));
    expect(screen.queryByText(/Approximate location/)).not.toBeInTheDocument();
  });

  it("shows the parcel number as the title and copyable coordinates", () => {
    panel(makeParcel("a"));
    expect(screen.getByRole("heading", { name: "KAJ/a" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Copy coordinates -1.49175, 36.98848" }),
    ).toHaveTextContent("1.49175° S, 36.98848° E");
  });

  it("links to Street View only where Google has coverage", () => {
    const { unmount } = panel(makeParcel("a", { svAvailable: true }));
    expect(screen.getByRole("link", { name: /Street View/ })).toHaveAttribute(
      "href",
      "https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=-1.491750,36.988480",
    );
    unmount();

    panel(makeParcel("a", { svAvailable: null }));
    expect(screen.queryByRole("link", { name: /Street View/ })).not.toBeInTheDocument();
    expect(screen.getByText("No Street View here")).toBeInTheDocument();
  });

  it("offers verification on an available plot and vouches for a verified one", () => {
    const { unmount } = panel(makeParcel("a"));
    expect(screen.getByText("Not verified yet")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /request verification/i })).toHaveAttribute(
      "href",
      "/login",
    );
    unmount();

    panel(makeParcel("a", { status: "verified" }));
    expect(screen.getByText("Verified by Geo Pin")).toBeInTheDocument();
  });
});

describe("listing card", () => {
  it("tags a pin-only parcel as an approximate location", () => {
    render(
      <ListingCard
        title="KAJ/a"
        mono
        sub="1/8 acre · Kitengela"
        price="KES 1"
        tag="Land for sale"
        color="var(--s-lsale)"
        approx
        selected={false}
        hot={false}
        onSelect={vi.fn()}
        onHover={vi.fn()}
      />,
    );
    expect(screen.getByText("Approx. location")).toBeInTheDocument();
  });
});

describe("compare", () => {
  it("keeps the Compare button disabled until two plots are picked", () => {
    const { rerender } = render(
      <CompareTray parcels={[listed[0]]} onRemove={vi.fn()} onOpen={vi.fn()} onClear={vi.fn()} />,
    );
    expect(screen.getByRole("button", { name: "Pick 1 more" })).toBeDisabled();

    rerender(
      <CompareTray
        parcels={listed.slice(0, 2)}
        onRemove={vi.fn()}
        onOpen={vi.fn()}
        onClear={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Compare" })).toBeEnabled();
    expect(screen.getByText("2/3")).toBeInTheDocument();
  });

  it("warns that price per acre isn't comparable across sale and lease", () => {
    render(
      <CompareModal
        parcels={[listed[0], { ...listed[1], listingType: "lease" }]}
        onRemove={vi.fn()}
        onView={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText(/comparing land for sale with land for lease/)).toBeInTheDocument();
  });

  it("allows three plots and explains why a fourth isn't added", async () => {
    mockSearch.mockReturnValue({});
    render(<LandPage />);

    for (const id of ["1", "2", "3", "4"]) {
      await userEvent.click(screen.getByRole("button", { name: `Add KAJ/${id} to compare` }));
    }

    expect(screen.getByRole("region", { name: "Compare plots" })).toHaveTextContent("3/3");
    expect(screen.getByRole("button", { name: "Add KAJ/4 to compare" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByText("You can compare up to 3 plots")).toBeInTheDocument();
  });
});

describe("land filters", () => {
  beforeEach(() => mockSearch.mockReturnValue({}));

  it("offers verified and available, never sold", () => {
    render(<LandPage />);
    const status = within(screen.getByRole("group", { name: "Status" }));
    expect(status.getAllByRole("button").map((b) => b.textContent)).toEqual([
      "All",
      "Verified",
      "Available",
    ]);
    expect(screen.queryByText("Sold")).not.toBeInTheDocument();
  });
});
