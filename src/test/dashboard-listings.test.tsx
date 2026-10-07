import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { MyProperty } from "@/lib/properties";
import type { AppUser, ListingDetail, UserListing } from "@/lib/auth";

const mockDeleteProperty = vi.fn<(id: string) => Promise<unknown>>(() => Promise.resolve({}));
const mockMarkTaken = vi.fn<(id: string) => Promise<unknown>>(() => Promise.resolve({}));
const mockRemoveListing = vi.fn<(id: string) => Promise<void>>(() => Promise.resolve());
const mockMarkSold = vi.fn<(id: string) => Promise<void>>(() => Promise.resolve());
const mockFetchListing = vi.fn<(id: string) => Promise<ListingDetail>>();
const mockApiGet = vi.fn<(path: string) => Promise<unknown>>();
const mockNavigate = vi.fn();
const mockProperties = vi.fn<() => { data: MyProperty[]; isLoading: boolean; isError: boolean }>(
  () => ({ data: [], isLoading: false, isError: false }),
);
const mockUser = vi.fn<() => AppUser | null>(() => null);

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (opts: object) => ({ ...opts, useSearch: () => ({}) }),
  useNavigate: () => mockNavigate,
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));

vi.mock("@/lib/properties", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/properties")>();
  return {
    ...actual,
    useMyProperties: () => ({ ...mockProperties(), refetch: vi.fn() }),
    useDeleteProperty: () => ({ mutateAsync: mockDeleteProperty, isPending: false }),
    useMarkPropertyTaken: () => ({ mutateAsync: mockMarkTaken, isPending: false }),
  };
});

vi.mock("@/lib/auth", () => ({
  useAuth: () => ({
    user: mockUser(),
    ready: true,
    removeListing: mockRemoveListing,
    markListingSold: mockMarkSold,
    fetchListing: mockFetchListing,
  }),
}));

vi.mock("@/lib/api", () => ({
  api: { get: mockApiGet, post: vi.fn(), delete: vi.fn(), getBlob: vi.fn() },
}));

vi.mock("@/lib/plans", () => ({ usePlans: () => ({ data: [] }), addOns: [] }));

vi.mock("@/components/LandBoundaryMap", () => ({ LandBoundaryMap: () => <div /> }));

const { ListingsTab } = await import("@/components/dashboard/ListingsTab");

const land: UserListing = {
  id: "l-1",
  title: "Kiambu 2-Acre Plot",
  parcelNumber: "NRB/BLK12/456",
  county: "Kiambu",
  price: 8500000,
  status: "active",
  views: 40,
  createdAt: "2026-09-01",
  coverPhotoUrl: null,
};

const property: MyProperty = {
  id: "p-1",
  reference: "PRP-ABC12345",
  title: "Kilimani 2BR Apartment",
  county: "Nairobi",
  area: "Kilimani",
  intent: "rent",
  type: "apartment",
  price: 75000,
  pricePeriod: "month",
  status: "available",
  postingPaymentStatus: "not_required",
  views: 12,
  createdAt: "2026-09-04",
  coverPhotoUrl: null,
};

const user = { listings: [land], customReports: false } as unknown as AppUser;

/** The mobile card list — one entry per visible row. */
const cards = (c: HTMLElement) => Array.from(c.querySelectorAll("ul.md\\:hidden > li"));

describe("ListingsTab — land and rentals in one list", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser.mockReturnValue(user);
    mockProperties.mockReturnValue({ data: [property], isLoading: false, isError: false });
  });

  it("lists both kinds, newest first", () => {
    const { container } = render(<ListingsTab />);

    const rows = container.querySelectorAll("tbody tr");
    expect(rows).toHaveLength(2);
    expect(within(rows[0] as HTMLElement).getByText("Kilimani 2BR Apartment")).toBeInTheDocument();
    expect(within(rows[1] as HTMLElement).getByText("NRB/BLK12/456")).toBeInTheDocument();
  });

  it("filters down to each kind", async () => {
    const { container } = render(<ListingsTab />);

    expect(screen.getByRole("button", { name: "All 2" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Land 1" }));
    expect(cards(container)).toHaveLength(1);
    expect(screen.getAllByText("NRB/BLK12/456").length).toBeGreaterThan(0);
    expect(screen.queryByText("Kilimani 2BR Apartment")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Rentals 1" }));
    expect(cards(container)).toHaveLength(1);
    expect(screen.getAllByText("Kilimani 2BR Apartment").length).toBeGreaterThan(0);
    expect(screen.queryByText("NRB/BLK12/456")).not.toBeInTheDocument();
  });

  /** Only land has an edit flow, so the action set has to follow the row. */
  it("offers Edit on land and not on a rental", () => {
    const { container } = render(<ListingsTab />);

    const rows = container.querySelectorAll("tbody tr");
    const rental = within(rows[0] as HTMLElement);
    const parcel = within(rows[1] as HTMLElement);

    expect(parcel.getByTitle("Edit")).toBeInTheDocument();
    expect(parcel.getByTitle("Mark as sold")).toBeInTheDocument();
    expect(rental.queryByTitle("Edit")).not.toBeInTheDocument();
    expect(rental.getByTitle("Mark as taken")).toBeInTheDocument();
  });

  /** View counts are an analytics metric, which is part of the paid plan. */
  it("shows view counts only with analytics access", () => {
    const { unmount } = render(<ListingsTab />);
    expect(screen.queryByRole("columnheader", { name: "Views" })).not.toBeInTheDocument();
    expect(screen.queryByText(/40 views/)).not.toBeInTheDocument();
    unmount();

    mockUser.mockReturnValue({ ...user, analyticsAccess: true });
    render(<ListingsTab />);
    expect(screen.getByRole("columnheader", { name: "Views" })).toBeInTheDocument();
    expect(screen.getByText(/40 views/)).toBeInTheDocument();
  });
});

describe("ListingsTab — confirmations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser.mockReturnValue(user);
    mockProperties.mockReturnValue({ data: [property], isLoading: false, isError: false });
  });

  it("does not delete on the first click", async () => {
    render(<ListingsTab />);

    await userEvent.click(screen.getAllByLabelText(`Delete ${property.title}`)[0]);

    expect(mockDeleteProperty).not.toHaveBeenCalled();
    expect(screen.getByText("Delete this property?")).toBeInTheDocument();
  });

  it("deletes the row the dialog was opened from", async () => {
    render(<ListingsTab />);

    await userEvent.click(screen.getAllByLabelText(`Delete ${property.title}`)[0]);
    await userEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", { name: "Delete" }),
    );
    expect(mockDeleteProperty).toHaveBeenCalledWith(property.id);
    expect(mockRemoveListing).not.toHaveBeenCalled();

    await userEvent.click(screen.getAllByLabelText(`Delete ${land.parcelNumber}`)[0]);
    await userEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", { name: "Delete" }),
    );
    expect(mockRemoveListing).toHaveBeenCalledWith(land.id);
  });

  it("cancels without deleting", async () => {
    render(<ListingsTab />);

    await userEvent.click(screen.getAllByLabelText(`Delete ${land.parcelNumber}`)[0]);
    await userEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", { name: "Cancel" }),
    );

    expect(mockRemoveListing).not.toHaveBeenCalled();
    expect(screen.queryByText("Delete this listing?")).not.toBeInTheDocument();
  });

  it("closes on Escape without deleting", async () => {
    render(<ListingsTab />);

    await userEvent.click(screen.getAllByLabelText(`Delete ${land.parcelNumber}`)[0]);
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(mockRemoveListing).not.toHaveBeenCalled();
  });

  /**
   * Both closures are irreversible; land already confirmed, so putting the two
   * side by side means the rental has to as well.
   */
  it("confirms before marking a rental taken", async () => {
    render(<ListingsTab />);

    await userEvent.click(screen.getAllByTitle("Mark as taken")[0]);
    expect(mockMarkTaken).not.toHaveBeenCalled();

    await userEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", { name: "Mark as taken" }),
    );
    expect(mockMarkTaken).toHaveBeenCalledWith(property.id);
  });

  it("confirms before marking land sold", async () => {
    render(<ListingsTab />);

    await userEvent.click(screen.getAllByTitle("Mark as sold")[0]);
    expect(mockMarkSold).not.toHaveBeenCalled();

    await userEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", { name: "Mark as sold" }),
    );
    expect(mockMarkSold).toHaveBeenCalledWith(land.id);
  });
});

const landDetail: ListingDetail = {
  id: "l-1",
  title: "Kiambu 2-Acre Plot",
  parcelNumber: "NRB/BLK12/456",
  county: "Kiambu",
  phone: "0712345678",
  area: "Ruiru",
  size: "100 × 200 ft",
  areaAcres: 2,
  price: 8500000,
  description: "Gently sloping red-soil plot.",
  latitude: -1.1462,
  longitude: 36.9634,
  boundary: null,
  boundarySource: "traced",
  listingType: "sale",
  landType: "mixed_use",
  utilities: ["Borehole", "Electricity"],
  status: "active",
  photos: [],
};

const propertyDetail = {
  id: "p-1",
  reference_number: "PRP-ABC12345",
  title: "Kilimani 2BR Apartment",
  county: "Nairobi",
  area: "Kilimani",
  intent: "rent",
  type: "apartment",
  price: 75000,
  price_period: "month",
  status: "available",
  posting_payment_status: "not_required",
  views: 12,
  created_at: "2026-09-04",
  cover_photo_url: null,
  description: "Bright corner unit near Yaya Centre.",
  bedrooms: 2,
  bathrooms: 1,
  furnished: true,
  amenities: ["Parking", "Backup generator"],
  min_nights: null,
  cleaning_fee: null,
  posted_by: "broker",
  agent_name: "Wanjiku Kamau",
  agent_phone: "0722000111",
  agent_agency: "Kamau Homes",
  latitude: -1.2921,
  longitude: 36.7822,
  posting_fee_amount: 0,
  photos: [],
};

function renderTab() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ListingsTab />
    </QueryClientProvider>,
  );
}

describe("ListingsTab — preview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser.mockReturnValue(user);
    mockProperties.mockReturnValue({ data: [property], isLoading: false, isError: false });
    mockFetchListing.mockResolvedValue(landDetail);
    mockApiGet.mockResolvedValue(propertyDetail);
  });

  it("opens a land row with its full details", async () => {
    const { container } = renderTab();

    await userEvent.click(container.querySelectorAll("tbody tr")[1]);

    const dialog = within(await screen.findByRole("dialog"));
    expect(mockFetchListing).toHaveBeenCalledWith(land.id);
    expect(await dialog.findByText("Gently sloping red-soil plot.")).toBeInTheDocument();
    expect(dialog.getByText("Kiambu 2-Acre Plot")).toBeInTheDocument();
    expect(dialog.getByText("Mixed use")).toBeInTheDocument();
    expect(dialog.getByText("Borehole")).toBeInTheDocument();
    expect(dialog.getByText("0712345678")).toBeInTheDocument();
  });

  it("opens a rental row with its full details", async () => {
    const { container } = renderTab();

    await userEvent.click(container.querySelectorAll("tbody tr")[0]);

    const dialog = within(await screen.findByRole("dialog"));
    expect(mockApiGet).toHaveBeenCalledWith(`/user/properties/${property.id}`);
    expect(await dialog.findByText("Bright corner unit near Yaya Centre.")).toBeInTheDocument();
    expect(dialog.getByText("KES 75,000 / month")).toBeInTheDocument();
    expect(dialog.getByText("Backup generator")).toBeInTheDocument();
    expect(dialog.getByText("Wanjiku Kamau")).toBeInTheDocument();
    expect(dialog.queryByRole("button", { name: /Edit/ })).not.toBeInTheDocument();
  });

  it("offers a retry when the details fail to load", async () => {
    mockFetchListing.mockRejectedValueOnce(new Error("offline"));
    const { container } = renderTab();

    await userEvent.click(container.querySelectorAll("tbody tr")[1]);
    const dialog = within(await screen.findByRole("dialog"));
    await userEvent.click(await dialog.findByRole("button", { name: "Try again" }));

    expect(await dialog.findByText("Gently sloping red-soil plot.")).toBeInTheDocument();
  });

  /** The row is clickable, so its own action buttons must not also open the preview. */
  it("keeps the row actions out of the preview", async () => {
    renderTab();

    await userEvent.click(screen.getAllByLabelText(`Delete ${land.parcelNumber}`)[0]);

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(mockFetchListing).not.toHaveBeenCalled();
  });

  /** jsdom has no media queries, so both layouts render; each is gated to its breakpoint. */
  it("opens from the mobile card and hands actions to the confirmation", async () => {
    const { container } = renderTab();

    expect(container.querySelector("div.hidden.md\\:block table")).toBeInTheDocument();
    const landCard = cards(container)[1].querySelector("button") as HTMLElement;
    await userEvent.click(landCard);

    const dialog = within(await screen.findByRole("dialog"));
    await userEvent.click(dialog.getByRole("button", { name: "Mark as sold" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(mockMarkSold).not.toHaveBeenCalled();

    await userEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", { name: "Mark as sold" }),
    );
    expect(mockMarkSold).toHaveBeenCalledWith(land.id);
  });
});
