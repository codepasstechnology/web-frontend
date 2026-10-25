import type { ComponentType, ReactNode } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockPost = vi.fn<(path: string, body: Record<string, unknown>) => Promise<unknown>>(() =>
  Promise.resolve(),
);
const mockGet = vi.fn<(path: string) => Promise<unknown>>(() =>
  Promise.resolve({ policy_version: "1.0", saved: null }),
);
vi.mock("@/lib/api", () => ({ api: { post: mockPost, get: mockGet } }));

const mockToast = vi.fn();
vi.mock("sonner", () => ({ toast: { success: mockToast } }));

vi.mock("@/lib/auth", () => ({ useAuth: () => ({ user: null }) }));

vi.mock("@/components/site/MarketingShell", () => ({
  MarketingShell: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (opts: unknown) => opts,
  useLocation: () => ({ pathname: "/cookie-settings" }),
  Link: ({ to, children, className }: { to: string; children: ReactNode; className?: string }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}));

/** A fresh page load with the consent state already synced. */
const loadPage = async () => {
  vi.resetModules();
  const [{ Route }, { syncConsent }] = await Promise.all([
    import("@/routes/cookie-settings"),
    import("@/lib/consent"),
  ]);
  await syncConsent(false);
  const Page = (Route as unknown as { component: ComponentType }).component;
  render(<Page />);
};

const storedChoice = () => JSON.parse(localStorage.getItem("gp_cookie_consent") ?? "null");

beforeEach(() => {
  localStorage.clear();
  mockPost.mockClear();
  mockToast.mockClear();
});

describe("Cookie settings page", () => {
  it("breaks down every kind of storage, with optional cookies off until chosen", async () => {
    await loadPage();

    expect(screen.getByRole("heading", { name: "Cookies & Browsing" })).toBeInTheDocument();
    expect(
      screen.getByText("You haven't made a choice yet, so optional cookies are off."),
    ).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "Geo Pin analytics" })).not.toBeChecked();
    [
      "Optional cookies",
      "Always on",
      "Anonymous visit counts",
      "Technically necessary",
      "Services from other companies",
      "Shared links and campaign links (UTM)",
    ].forEach((heading) => expect(screen.getByText(heading)).toBeInTheDocument());
    ["gp_visitor", "gp_session", "lv_token_v1", "gp_cookie_consent", "lv_theme"].forEach((name) =>
      expect(screen.getByText(name)).toBeInTheDocument(),
    );
    expect(screen.getByText("Cloudflare")).toBeInTheDocument();
  });

  it("turns optional cookies on and off and records each change", async () => {
    await loadPage();

    await userEvent.click(screen.getByRole("button", { name: "Accept all" }));
    expect(screen.getByRole("switch", { name: "Geo Pin analytics" })).toBeChecked();
    expect(storedChoice()).toMatchObject({ choice: "all", version: "1.0" });
    expect(mockPost).toHaveBeenCalledWith(
      "/cookie-consent",
      expect.objectContaining({ choice: "all", source: "settings" }),
    );
    expect(mockToast).toHaveBeenCalledWith("Optional cookies turned on.");

    await userEvent.click(screen.getByRole("switch", { name: "Geo Pin analytics" }));
    expect(screen.getByRole("switch", { name: "Geo Pin analytics" })).not.toBeChecked();
    expect(storedChoice()).toMatchObject({ choice: "essential" });
    expect(mockPost).toHaveBeenCalledWith(
      "/cookie-consent",
      expect.objectContaining({ choice: "essential", source: "settings" }),
    );
  });
});
