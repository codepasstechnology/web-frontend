import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Plan } from "@/lib/plans";

const mockResume = vi.fn(() => Promise.resolve());
const mockToastSuccess = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
  Link: ({ children }: { children: React.ReactNode }) => <a href="/dashboard">{children}</a>,
}));
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
  { id: "free", name: "Free", price: 0, listings: 1, features: [], audience: "individual" },
  {
    id: "pro",
    name: "Pro",
    price: 2500,
    priceYearly: 25000,
    listings: 20,
    features: [],
    audience: "individual",
  },
  {
    id: "agency-free",
    name: "Agency Free",
    price: 0,
    listings: 5,
    features: [],
    audience: "agency",
  },
  {
    id: "agency-pro",
    name: "Agency Pro",
    price: 9500,
    priceYearly: 95000,
    listings: 100,
    features: [],
    audience: "agency",
  },
] as unknown as Plan[];

const showAccount = (plan: string, agencyRole?: string) =>
  render(
    <BillingTab
      plan={plan}
      billingCycle={null}
      planStatus={null}
      planEndsAt={null}
      planCancelledAt={null}
      plans={plans}
      agencyRole={agencyRole}
      maxListings={5}
      usedListings={0}
      payments={[]}
      onSelectPlan={vi.fn()}
      manager={null}
    />,
  );

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

  it("opens an agency on agency plans and only lets it pick those", async () => {
    showAccount("agency-free", "owner");

    expect(screen.getByRole("button", { name: "Agencies" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Upgrade to Agency Pro" })).toBeInTheDocument();
    expect(screen.queryByText("Pro", { selector: ".gd-eyebrow" })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Owners" }));
    expect(screen.getAllByRole("button", { name: "For individual accounts" })).toHaveLength(2);
  });

  it("opens an individual on owner plans and points agency plans to the agency set-up", async () => {
    showAccount("free");

    expect(screen.getByRole("button", { name: "Owners" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Upgrade to Pro" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Agencies" }));
    expect(screen.getAllByRole("link", { name: "Set up your agency" })).toHaveLength(2);
  });

  it("tells team members the owner manages the plan", () => {
    showAccount("agency-pro", "agent");

    expect(screen.getByText(/Your agency's owner manages the plan/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Upgrade/ })).not.toBeInTheDocument();
  });
});
