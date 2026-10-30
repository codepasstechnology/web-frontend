import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { DashTab } from "@/components/DashboardShell";
import type { UnseenLeads } from "@/lib/agency";

const mockNavigate = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
  Link: ({
    to,
    params,
    children,
  }: {
    to: string;
    params?: { slug: string };
    children: React.ReactNode;
  }) => <a href={params ? to.replace("$slug", params.slug) : to}>{children}</a>,
}));

const mockUser = vi.fn<() => object | null>(() => null);
vi.mock("@/lib/auth", () => ({ useAuth: () => ({ user: mockUser() }) }));
vi.mock("@/components/VerifyAccountModal", () => ({ VerifyAccountModal: () => null }));
vi.mock("@/components/home/HomeNavbar", () => ({ HomeNavbar: () => null }));
vi.mock("@/lib/properties", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/properties")>()),
  useUsedListings: () => 0,
}));
vi.mock("@/lib/plans", () => ({ usePlans: () => ({ data: [] }) }));

let unseen: UnseenLeads | undefined;
const mockMarkSeen = vi.fn();
vi.mock("@/lib/agency", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/agency")>()),
  useUnseenLeads: () => ({ data: unseen }),
  useMarkLeadsSeen: () => ({ mutate: mockMarkSeen }),
}));
let unreadMessages = 0;
vi.mock("@/lib/chat", () => ({ useUnreadMessages: () => ({ data: unreadMessages }) }));
const mockToast = vi.fn();
vi.mock("sonner", () => ({ toast: (...args: unknown[]) => mockToast(...args) }));

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
  beforeEach(() => {
    vi.clearAllMocks();
    unreadMessages = 0;
  });

  it("keeps every section reachable behind five slots", async () => {
    show("overview");

    const slots = bar().getAllByRole("button");
    expect(slots).toHaveLength(5);
    ["Overview", "My Listings", "Upload", "Analytics", "More sections"].forEach((name) =>
      expect(bar().getByRole("button", { name })).toBeInTheDocument(),
    );

    await userEvent.click(bar().getByRole("button", { name: "More sections" }));
    ["Messages", "Billing & Plan", "KYC Status", "Account Settings"].forEach((name) =>
      expect(screen.getByRole("menuitem", { name })).toBeInTheDocument(),
    );

    await userEvent.click(screen.getByRole("menuitem", { name: "Billing & Plan" }));
    expect(mockNavigate).toHaveBeenCalledWith({ to: "/dashboard", search: { tab: "billing" } });
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

  it("counts unread conversations on Messages until the tab is open", () => {
    unreadMessages = 3;
    const { rerender } = show("overview");

    const sidebar = within(screen.getByRole("complementary", { name: "Dashboard" }));
    expect(sidebar.getByRole("button", { name: /Messages/ })).toHaveTextContent("3");

    rerender(<DashboardShell active="messages">content</DashboardShell>);
    expect(sidebar.getByRole("button", { name: "Messages" })).not.toHaveTextContent("3");
  });

  it("highlights Upload in the sidebar on the upload pages", () => {
    show("upload");

    const sidebar = within(screen.getByRole("complementary", { name: "Dashboard" }));
    expect(sidebar.getByRole("button", { name: "Upload" })).toHaveAttribute("aria-current", "page");
    expect(sidebar.getByRole("button", { name: "Overview" })).not.toHaveAttribute("aria-current");
  });
});

describe("DashboardShell — agency accounts", () => {
  const agencyUser = (role: string, plan = "agency-free") => ({
    plan,
    maxListings: 5,
    agency: { id: "a-1", name: "Kilimani Homes", slug: "kilimani-homes", role },
  });

  beforeEach(() => {
    vi.clearAllMocks();
    unseen = undefined;
  });

  it("links to the agency's public page and offers the owner an agency upgrade", () => {
    mockUser.mockReturnValue(agencyUser("owner"));
    show("overview");

    const sidebar = within(screen.getByRole("complementary", { name: "Dashboard" }));
    expect(sidebar.getByRole("link", { name: "View agency page" })).toHaveAttribute(
      "href",
      "/agency/kilimani-homes",
    );
    expect(sidebar.getByRole("button", { name: "Upgrade to Agency Pro" })).toBeInTheDocument();
  });

  it("does not ask agents to upgrade, since the owner pays for the team", () => {
    mockUser.mockReturnValue(agencyUser("agent"));
    show("overview");

    expect(screen.getAllByRole("link", { name: "View agency page" }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /Upgrade/ })).not.toBeInTheDocument();
  });

  it("counts new leads on the Leads tab and pops up when another arrives", () => {
    mockUser.mockReturnValue(agencyUser("owner", "agency-pro"));
    unseen = {
      count: 2,
      latest: { id: "l-1", source: "message", name: "Amina", listingTitle: null },
    };
    const { rerender } = show("overview");

    const sidebar = within(screen.getByRole("complementary", { name: "Dashboard" }));
    expect(sidebar.getByRole("button", { name: /Leads/ })).toHaveTextContent("2");
    expect(bar().getByRole("button", { name: "Leads, 2 new" })).toBeInTheDocument();
    expect(mockToast).not.toHaveBeenCalled();

    unseen = {
      count: 3,
      latest: { id: "l-2", source: "viewing", name: "Brian", listingTitle: "Kilimani 2BR" },
    };
    rerender(<DashboardShell active="overview">content</DashboardShell>);
    expect(mockToast).toHaveBeenCalledWith(
      "New viewing request",
      expect.objectContaining({ description: "Brian · Kilimani 2BR" }),
    );
  });

  it("clears the count once the Leads tab is open", () => {
    mockUser.mockReturnValue(agencyUser("owner", "agency-pro"));
    unseen = {
      count: 2,
      latest: { id: "l-1", source: "message", name: "Amina", listingTitle: null },
    };
    show("leads");

    expect(mockMarkSeen).toHaveBeenCalled();
    expect(bar().getByRole("button", { name: "Leads" })).not.toHaveTextContent("2");
  });
});
