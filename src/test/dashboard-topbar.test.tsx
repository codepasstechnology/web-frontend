import React from "react";
import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

beforeAll(() => {
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
  })) as unknown as typeof window.matchMedia;
});

const mockNavigate = vi.fn();
const mockLogout = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
  Link: ({ to, children, ...rest }: { to: string } & React.ComponentProps<"a">) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));
vi.mock("@/lib/auth", () => ({
  useAuth: () => ({
    user: { fullName: "Wanjiku Kamau", email: "wanjiku@example.com", avatarColor: null },
    logout: mockLogout,
  }),
}));
vi.mock("@/components/NotificationBell", () => ({ NotificationBell: () => null }));

const { DashboardTopBar } = await import("@/components/dashboard/DashboardTopBar");

describe("DashboardTopBar", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows the site links, with the theme toggle in the account menu", async () => {
    render(<DashboardTopBar onSelect={vi.fn()} />);

    ["Explore map", "Land", "Rentals", "Help"].forEach((name) =>
      expect(screen.getByRole("link", { name })).toBeInTheDocument(),
    );
    expect(screen.queryByRole("switch", { name: "Dark mode" })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Account menu" }));
    expect(screen.getByRole("menuitem", { name: "Switch to dark mode" })).toBeInTheDocument();
  });

  it("routes the account menu to Settings and Billing, and logs out", async () => {
    const onSelect = vi.fn();
    render(<DashboardTopBar onSelect={onSelect} />);

    await userEvent.click(screen.getByRole("button", { name: "Account menu" }));
    expect(screen.getByText("WK", { selector: ".gd-pop .gd-avatar" })).toBeInTheDocument();
    expect(screen.getByText("wanjiku@example.com")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("menuitem", { name: "Account settings" }));
    expect(onSelect).toHaveBeenCalledWith("settings");

    await userEvent.click(screen.getByRole("button", { name: "Account menu" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Billing & plan" }));
    expect(onSelect).toHaveBeenCalledWith("billing");

    await userEvent.click(screen.getByRole("button", { name: "Account menu" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Log out" }));
    expect(mockLogout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith({ to: "/" });
  });
});
