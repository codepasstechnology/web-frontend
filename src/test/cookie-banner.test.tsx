import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

type ConsentResponse = {
  policy_version: string;
  saved: { choice: "all" | "essential"; policy_version: string; at: string } | null;
};

const mockPost = vi.fn<(path: string, body: Record<string, unknown>) => Promise<unknown>>(() =>
  Promise.resolve(),
);
const mockGet = vi.fn<(path: string) => Promise<ConsentResponse>>();
vi.mock("@/lib/api", () => ({ api: { post: mockPost, get: mockGet } }));

let mockUser: { id: string } | null = null;
let mockPath = "/";
vi.mock("@/lib/auth", () => ({ useAuth: () => ({ user: mockUser }) }));

vi.mock("@tanstack/react-router", () => ({
  useLocation: () => ({ pathname: mockPath }),
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

const YEAR = 365 * 24 * 60 * 60 * 1000;
const CONSENT_ID = "22222222-2222-4222-8222-222222222222";

const saveChoice = (choice: "all" | "essential", version = "1.0", at = Date.now()) =>
  localStorage.setItem(
    "gp_cookie_consent",
    JSON.stringify({ choice, at, version, id: CONSENT_ID }),
  );
const storedChoice = () => JSON.parse(localStorage.getItem("gp_cookie_consent") ?? "null");
const consentPosts = () => mockPost.mock.calls.filter(([path]) => path === "/cookie-consent");

/** A fresh page load: the banner reads the saved choice and asks the API again. */
const loadBanner = async () => {
  vi.resetModules();
  const [{ CookieBanner }, consent] = await Promise.all([
    import("@/components/CookieBanner"),
    import("@/lib/consent"),
  ]);
  render(<CookieBanner />);
  await waitFor(() => expect(mockGet).toHaveBeenCalled());
  return consent;
};

beforeEach(() => {
  localStorage.clear();
  mockPost.mockClear();
  mockGet.mockReset();
  mockGet.mockResolvedValue({ policy_version: "1.0", saved: null });
  mockUser = null;
  mockPath = "/";
});

afterEach(() => {
  Reflect.deleteProperty(navigator, "globalPrivacyControl");
});

describe("CookieBanner", () => {
  it("asks first-time visitors and records the choice with the policy version", async () => {
    await loadBanner();

    expect(await screen.findByRole("dialog", { name: "Cookie preferences" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Cookie policy" })).toHaveAttribute(
      "href",
      "/cookie-policy",
    );

    expect(screen.getByRole("link", { name: "Cookie settings" })).toHaveAttribute(
      "href",
      "/cookie-settings",
    );

    await userEvent.click(screen.getByRole("button", { name: "Accept all" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(storedChoice()).toMatchObject({ choice: "all", version: "1.0" });
    expect(consentPosts()).toEqual([
      [
        "/cookie-consent",
        {
          consent_id: storedChoice().id,
          choice: "all",
          policy_version: "1.0",
          source: "banner",
        },
      ],
    ]);
    expect(mockPost).toHaveBeenCalledWith(
      "/traffic/visit",
      expect.objectContaining({ entry: true }),
    );
  });

  it("forgets the analytics ids when optional cookies are rejected", async () => {
    localStorage.setItem("gp_visitor", "11111111-1111-4111-8111-111111111111");
    await loadBanner();

    await userEvent.click(await screen.findByRole("button", { name: "Reject all" }));

    expect(storedChoice()).toMatchObject({ choice: "essential" });
    expect(localStorage.getItem("gp_visitor")).toBeNull();
    expect(mockPost).not.toHaveBeenCalledWith("/traffic/visit", expect.anything());
  });

  it("stays hidden once a choice is made, and on the Cookie settings page", async () => {
    saveChoice("essential");
    await loadBanner();
    await waitFor(() => expect(mockGet).toHaveBeenCalled());
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    localStorage.clear();
    mockPath = "/cookie-settings";
    await loadBanner();
    await new Promise((r) => setTimeout(r, 0));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("asks again when the cookie policy changes", async () => {
    saveChoice("all", "1.0");
    mockGet.mockResolvedValue({ policy_version: "2.0", saved: null });
    await loadBanner();

    expect(await screen.findByRole("dialog", { name: "Cookie preferences" })).toBeInTheDocument();
  });

  it("asks again a year after the last choice", async () => {
    saveChoice("all", "1.0", Date.now() - YEAR - 1000);
    await loadBanner();

    expect(await screen.findByRole("dialog", { name: "Cookie preferences" })).toBeInTheDocument();
  });

  it("treats the Global Privacy Control signal as essential only without asking", async () => {
    Object.defineProperty(navigator, "globalPrivacyControl", { value: true, configurable: true });
    await loadBanner();

    await waitFor(() => expect(storedChoice()).toMatchObject({ choice: "essential" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(consentPosts()[0][1]).toMatchObject({ choice: "essential", source: "gpc" });
  });

  it("uses the choice saved on the signed-in account from another device", async () => {
    mockUser = { id: "u1" };
    mockGet.mockResolvedValue({
      policy_version: "1.0",
      saved: { choice: "all", policy_version: "1.0", at: new Date().toISOString() },
    });
    await loadBanner();

    await waitFor(() => expect(storedChoice()).toMatchObject({ choice: "all" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(consentPosts()).toHaveLength(0);
  });

  it("saves this browser's choice to the account when the account has none", async () => {
    saveChoice("essential");
    mockUser = { id: "u1" };
    await loadBanner();

    await waitFor(() =>
      expect(consentPosts()[0][1]).toMatchObject({
        consent_id: CONSENT_ID,
        choice: "essential",
        source: "account",
      }),
    );
  });
});
