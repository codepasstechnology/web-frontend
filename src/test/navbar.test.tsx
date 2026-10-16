import React from "react";
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
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

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: "/" }),
  Link: React.forwardRef<
    HTMLAnchorElement,
    { to: string; activeProps?: unknown; search?: unknown } & React.ComponentProps<"a">
  >(({ to, activeProps: _a, search: _s, ...rest }, ref) => <a ref={ref} href={to} {...rest} />),
}));
vi.mock("@/lib/auth", () => ({ useAuth: () => ({ user: null, logout: vi.fn() }) }));
vi.mock("@/components/NotificationBell", () => ({ NotificationBell: () => null }));

const { Navbar } = await import("@/components/Navbar");

const pinTrigger = () => screen.getByRole("button", { name: "Pin Properties" });

let onIntersect: ((entries: { isIntersecting: boolean }[]) => void) | null = null;

class FakeIntersectionObserver {
  constructor(cb: (entries: { isIntersecting: boolean }[]) => void) {
    onIntersect = cb;
  }
  observe() {}
  disconnect() {}
}

describe("Navbar overlay mode", () => {
  beforeEach(() => {
    onIntersect = null;
    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = "";
  });

  function renderOverHero() {
    const hero = document.createElement("section");
    hero.setAttribute("data-nav-overlay", "");
    document.body.appendChild(hero);
    return render(<Navbar scrollAware overlay />);
  }

  it("floats transparently over the hero with white links", () => {
    renderOverHero();
    const header = screen.getByRole("banner");
    expect(header.className).toContain("fixed");
    expect(header.className).toContain("bg-gradient-to-b");
    expect(pinTrigger().className).toContain("text-white/70");
  });

  it("turns frosted white once the hero scrolls out from under it", () => {
    renderOverHero();
    act(() => onIntersect?.([{ isIntersecting: false }]));
    const header = screen.getByRole("banner");
    expect(header.className).toContain("fixed");
    expect(header.className).not.toContain("bg-gradient-to-b");
    expect(pinTrigger().className).toContain("text-muted-foreground");
  });

  it("stays a normal sticky bar on pages without overlay", () => {
    render(<Navbar scrollAware />);
    const header = screen.getByRole("banner");
    expect(header.className).toContain("sticky");
    expect(header.className).not.toContain("bg-gradient-to-b");
    expect(onIntersect).toBeNull();
  });
});

describe("Navbar Pin Properties menu", () => {
  it("groups the explore map, land and rentals under one dropdown", async () => {
    render(<Navbar />);

    await userEvent.click(pinTrigger());
    const items = screen.getAllByRole("menuitem");
    expect(items.map((i) => i.getAttribute("href"))).toEqual(["/explore", "/land", "/rentals"]);
    expect(items[0]).toHaveTextContent("Explore map");
  });

  it("drops Land and Rentals down from Explore map in the mobile menu", async () => {
    render(<Navbar />);
    const toggle = screen.getByRole("button", { name: "Show land and rentals" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("link", { name: "Rentals" })).not.toBeInTheDocument();

    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: "Land" })).toHaveAttribute("href", "/land");
    expect(screen.getByRole("link", { name: "Rentals" })).toHaveAttribute("href", "/rentals");
  });
});
