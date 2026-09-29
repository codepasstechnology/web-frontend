import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { MyProperty } from "@/lib/properties";
import type { AppUser, UserListing } from "@/lib/auth";

const mockDeleteProperty = vi.fn<(id: string) => Promise<unknown>>(() => Promise.resolve({}));
const mockMarkTaken = vi.fn<(id: string) => Promise<unknown>>(() => Promise.resolve({}));
const mockRemoveListing = vi.fn<(id: string) => Promise<void>>(() => Promise.resolve());
const mockMarkSold = vi.fn<(id: string) => Promise<void>>(() => Promise.resolve());
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
  }),
}));

vi.mock("@/lib/api", () => ({
  api: { get: vi.fn(), post: vi.fn(), delete: vi.fn(), getBlob: vi.fn() },
}));

vi.mock("@/lib/plans", () => ({ usePlans: () => ({ data: [] }), addOns: [] }));

vi.mock("@/components/LandBoundaryMap", () => ({ LandBoundaryMap: () => <div /> }));

const { ListingsTab } = await import("../routes/dashboard.index");

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
const cards = (c: HTMLElement) => Array.from(c.querySelectorAll("div.md\\:hidden > div"));

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
      within(screen.getByRole("dialog")).getByRole("button", { name: "Delete" }),
    );
    expect(mockDeleteProperty).toHaveBeenCalledWith(property.id);
    expect(mockRemoveListing).not.toHaveBeenCalled();

    await userEvent.click(screen.getAllByLabelText(`Delete ${land.parcelNumber}`)[0]);
    await userEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "Delete" }),
    );
    expect(mockRemoveListing).toHaveBeenCalledWith(land.id);
  });

  it("cancels without deleting", async () => {
    render(<ListingsTab />);

    await userEvent.click(screen.getAllByLabelText(`Delete ${land.parcelNumber}`)[0]);
    await userEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "Cancel" }),
    );

    expect(mockRemoveListing).not.toHaveBeenCalled();
    expect(screen.queryByText("Delete this listing?")).not.toBeInTheDocument();
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
      within(screen.getByRole("dialog")).getByRole("button", { name: "Mark as taken" }),
    );
    expect(mockMarkTaken).toHaveBeenCalledWith(property.id);
  });

  it("confirms before marking land sold", async () => {
    render(<ListingsTab />);

    await userEvent.click(screen.getAllByTitle("Mark as sold")[0]);
    expect(mockMarkSold).not.toHaveBeenCalled();

    await userEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "Mark as sold" }),
    );
    expect(mockMarkSold).toHaveBeenCalledWith(land.id);
  });
});
