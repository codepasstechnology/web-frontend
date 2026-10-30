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
let mockUser: { fullName: string; email: string; avatarColor: null } | null = null;

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
  Link: ({
    to,
    search,
    children,
    ...rest
  }: { to: string; search?: { tab?: string } } & React.ComponentProps<"a">) => (
    <a href={search?.tab ? `${to}?tab=${search.tab}` : to} {...rest}>
      {children}
    </a>
  ),
}));
vi.mock("@/lib/auth", () => ({ useAuth: () => ({ user: mockUser, logout: mockLogout }) }));
vi.mock("@/components/NotificationBell", () => ({
  NotificationBell: () => <button type="button">Notifications</button>,
}));
vi.mock("@/components/MessagesButton", () => ({
  MessagesButton: () => <a href="/dashboard?tab=messages">Messages</a>,
}));

const { HomeNavbar } = await import("@/components/home/HomeNavbar");

describe("HomeNavbar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = null;
  });

  it("offers sign-in and the theme switch to visitors", () => {
    render(<HomeNavbar />);

    expect(screen.getByRole("link", { name: "Login" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "List a property" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Dashboard" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Switch to dark mode" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Account menu" })).not.toBeInTheDocument();
  });

  it("gives signed-in users the bell and an account menu with the theme and log out", async () => {
    mockUser = { fullName: "Wanjiku Kamau", email: "wanjiku@example.com", avatarColor: null };
    render(<HomeNavbar />);

    expect(screen.getByRole("button", { name: "Notifications" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Messages" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Pricing" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("href", "/dashboard");
    expect(screen.queryByRole("link", { name: "List a property" })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Account menu" }));
    expect(screen.getByText("wanjiku@example.com")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /Account settings/ })).toHaveAttribute(
      "href",
      "/dashboard?tab=settings",
    );
    expect(screen.getByRole("menuitem", { name: /Billing & plan/ })).toHaveAttribute(
      "href",
      "/dashboard?tab=billing",
    );
    expect(screen.getByRole("menuitem", { name: /Switch to dark mode/ })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("menuitem", { name: /Log out/ }));
    expect(mockLogout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith({ to: "/" });
  });
});
