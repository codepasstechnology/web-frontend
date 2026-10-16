import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { AppUser, UserListing } from "@/lib/auth";

vi.mock("@tanstack/react-router", () => ({ useNavigate: () => vi.fn() }));
vi.mock("@/lib/plans", () => ({
  usePlans: () => ({
    data: [
      { id: "basic", name: "Basic", price: 1500, priceYearly: 13500, photos: 10, documents: 6 },
    ],
  }),
}));
const mockKyc = vi.fn<() => { status: string; user_reply: null; user_reply_document_path: null }[]>(
  () => [],
);
vi.mock("@/lib/kyc", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/kyc")>()),
  useKycApplications: () => ({ data: mockKyc() }),
}));

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

  it("takes the next billing date from the subscription, not today + 30", () => {
    show({
      ...user,
      plan: "basic",
      billingCycle: "monthly",
      planEndsAt: "2026-11-01T00:00:00Z",
      planCancelledAt: null,
    } as AppUser);

    expect(screen.getByText(/Next billing: KES 1,500 on 1 Nov 2026/)).toBeInTheDocument();
  });

  it("says nothing is due on Free", () => {
    show({ ...user, plan: "free", planEndsAt: null } as AppUser);

    expect(screen.getByText(/You are on the Free plan. No payments due./)).toBeInTheDocument();
  });

  it("counts KYC items waiting on the user and ticks verification once one is approved", () => {
    mockKyc.mockReturnValue([
      { status: "info_requested", user_reply: null, user_reply_document_path: null },
      { status: "approved", user_reply: null, user_reply_document_path: null },
    ]);
    show(user);

    expect(screen.getByText("KYC: a reviewer asked for more information")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Get your listing documents reviewed\s*\(done\)/ }),
    ).toBeInTheDocument();
  });
});
