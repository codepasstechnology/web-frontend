import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Plan } from "@/lib/plans";

const mockResume = vi.fn(() => Promise.resolve());
const mockToastSuccess = vi.fn();
vi.mock("@tanstack/react-router", () => ({ useNavigate: () => vi.fn() }));
vi.mock("@/lib/auth", () => ({
  useAuth: () => ({
    reloadUser: vi.fn(() => Promise.resolve()),
    verifyCardPayment: vi.fn(),
    resumeSubscription: mockResume,
  }),
}));
vi.mock("@/components/BoostModal", () => ({ BoostModal: () => null }));
vi.mock("sonner", () => ({ toast: { success: mockToastSuccess, error: vi.fn() } }));

const { BillingTab } = await import("@/components/dashboard/BillingTab");

const plans = [
  { id: "free", name: "Free", price: 0, listings: 1, features: [] },
  { id: "pro", name: "Pro", price: 2500, priceYearly: 25000, listings: 20, features: [] },
] as unknown as Plan[];

const show = (planCancelledAt: string | null, onSelectPlan = vi.fn()) =>
  render(
    <BillingTab
      plan="pro"
      billingCycle="monthly"
      planStatus="active"
      planEndsAt="2026-11-15"
      planCancelledAt={planCancelledAt}
      plans={plans}
      maxListings={20}
      usedListings={2}
      payments={[]}
      onSelectPlan={onSelectPlan}
      manager={null}
    />,
  );

describe("BillingTab", () => {
  beforeEach(() => vi.clearAllMocks());

  it("resumes a cancelled plan without opening checkout", async () => {
    const onSelectPlan = vi.fn();
    show("2026-10-10", onSelectPlan);

    await userEvent.click(screen.getByRole("button", { name: "Resume" }));

    await waitFor(() => expect(mockResume).toHaveBeenCalled());
    expect(onSelectPlan).not.toHaveBeenCalled();
    expect(mockToastSuccess).toHaveBeenCalledWith(expect.stringMatching(/^Resumed\./));
  });

  it("renews an active plan through checkout", async () => {
    const onSelectPlan = vi.fn();
    show(null, onSelectPlan);

    expect(screen.queryByRole("button", { name: "Resume" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Renew" }));

    expect(onSelectPlan).toHaveBeenCalledWith("pro", "monthly");
    expect(mockResume).not.toHaveBeenCalled();
  });
});
