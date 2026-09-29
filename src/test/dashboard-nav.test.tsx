import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { DashTab } from "@/components/DashboardShell";

const mockNavigate = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));

vi.mock("@/lib/auth", () => ({ useAuth: () => ({ user: null }) }));
vi.mock("@/components/VerifyAccountModal", () => ({ VerifyAccountModal: () => null }));
vi.mock("@/components/Navbar", () => ({ Navbar: () => null }));

const { DashboardShell } = await import("@/components/DashboardShell");

/**
 * jsdom has no media queries, so the desktop sidebar renders too. The bottom
 * bar is the only <nav> inside the `md:hidden` wrapper.
 */
const bar = () => within(screen.getByRole("navigation", { name: "Dashboard sections" }));

const show = (active: DashTab) => render(<DashboardShell active={active}>content</DashboardShell>);

const expanded = () =>
  Array.from(document.querySelectorAll("nav [style*='grid-template-columns: 1fr']"));

describe("DashboardShell — bottom nav", () => {
  beforeEach(() => vi.clearAllMocks());

  it("keeps every section reachable behind five slots", async () => {
    show("overview");

    const slots = bar().getAllByRole("button");
    expect(slots).toHaveLength(5);
    ["Overview", "My Listings", "Upload", "Analytics", "More sections"].forEach((name) =>
      expect(bar().getByRole("button", { name })).toBeInTheDocument(),
    );

    await userEvent.click(bar().getByRole("button", { name: "More sections" }));
    ["Billing & Plan", "KYC Status", "Account Settings"].forEach((name) =>
      expect(bar().getByRole("button", { name })).toBeInTheDocument(),
    );
  });

  it("expands exactly one pill, and marks it as the current page", () => {
    show("analytics");

    expect(expanded()).toHaveLength(1);
    expect(bar().getByRole("button", { name: "Analytics" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(bar().getByRole("button", { name: "Overview" })).not.toHaveAttribute("aria-current");
  });

  it("routes a tab through the search param and Upload to its own page", async () => {
    show("overview");

    await userEvent.click(bar().getByRole("button", { name: "Analytics" }));
    expect(mockNavigate).toHaveBeenCalledWith({ to: "/dashboard", search: { tab: "analytics" } });

    await userEvent.click(bar().getByRole("button", { name: "Upload" }));
    expect(mockNavigate).toHaveBeenCalledWith({
      to: "/dashboard/upload",
      search: { edit: undefined, type: undefined },
    });
  });

  /** An overflow section still has to leave exactly one pill open. */
  it("expands the More slot when an overflow section is active", () => {
    show("billing");

    expect(expanded()).toHaveLength(1);
    expect(bar().getByRole("button", { name: "More sections" })).toHaveTextContent("Billing");
    expect(bar().getByRole("button", { name: "Overview" })).not.toHaveAttribute("aria-current");
  });
});
