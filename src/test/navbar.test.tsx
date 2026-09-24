import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, render, screen } from "@testing-library/react";

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
  Link: ({
    to,
    children,
    className,
  }: {
    to: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}));
vi.mock("@/lib/auth", () => ({ useAuth: () => ({ user: null, logout: vi.fn() }) }));
vi.mock("@/components/NotificationBell", () => ({ NotificationBell: () => null }));

const { Navbar } = await import("@/components/Navbar");

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
    expect(screen.getAllByRole("link", { name: "Land" })[0].className).toContain("text-white/70");
  });

  it("turns frosted white once the hero scrolls out from under it", () => {
    renderOverHero();
    act(() => onIntersect?.([{ isIntersecting: false }]));
    const header = screen.getByRole("banner");
    expect(header.className).toContain("fixed");
    expect(header.className).not.toContain("bg-gradient-to-b");
    expect(screen.getAllByRole("link", { name: "Land" })[0].className).toContain(
      "text-muted-foreground",
    );
  });

  it("stays a normal sticky bar on pages without overlay", () => {
    render(<Navbar scrollAware />);
    const header = screen.getByRole("banner");
    expect(header.className).toContain("sticky");
    expect(header.className).not.toContain("bg-gradient-to-b");
    expect(onIntersect).toBeNull();
  });
});
