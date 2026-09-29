import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { AppUser, UserListing } from "@/lib/auth";

vi.mock("@tanstack/react-router", () => ({ useNavigate: () => vi.fn() }));
vi.mock("@/lib/plans", () => ({ usePlans: () => ({ data: [] }) }));

const { OverviewTab } = await import("@/components/dashboard/OverviewTab");

const listing: UserListing = {
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

const user = {
  fullName: "Wanjiku Kamau",
  plan: "agent",
  maxListings: 25,
  listings: [listing],
  analyticsAccess: false,
} as unknown as AppUser;

const show = (u: AppUser) => render(<OverviewTab user={u} onUpgrade={vi.fn()} onGoTab={vi.fn()} />);

describe("OverviewTab", () => {
  it("keeps listing counts and leaves view metrics to Analytics", () => {
    show(user);

    expect(screen.getByText("Active listings")).toBeInTheDocument();
    expect(screen.getByText("Pending review")).toBeInTheDocument();
    expect(screen.queryByText("Total views")).not.toBeInTheDocument();
    expect(screen.queryByText("Avg views / listing")).not.toBeInTheDocument();
    expect(screen.queryByText("Recent activity")).not.toBeInTheDocument();
    expect(screen.queryByText("Pro tip")).not.toBeInTheDocument();
  });

  it("shows per-listing views only with analytics access", () => {
    const { unmount } = show(user);
    expect(screen.queryByText("40")).not.toBeInTheDocument();
    unmount();

    show({ ...user, analyticsAccess: true });
    expect(screen.getByText("40")).toBeInTheDocument();
  });
});
