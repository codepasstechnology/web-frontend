import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { MaintenanceStatus } from "@/lib/maintenance";

const loadPage = vi.fn();
vi.mock("@/lib/pageNavigation", () => ({ loadPage: (...a: unknown[]) => loadPage(...a) }));
vi.mock("@/hooks/useTheme", () => ({ useTheme: () => ({ theme: "light", toggle: vi.fn() }) }));
vi.mock("@tanstack/react-router", () => ({
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

const { addBeacon, emailError, formatCountdown, MAX_BEACONS } = await import("@/lib/maintenance");
const { safeReturnPath } = await import("@/lib/maintenanceRedirect");
const { api } = await import("@/lib/api");
const { MaintenancePage } = await import("@/components/maintenance/MaintenancePage");

const baseStatus: MaintenanceStatus = {
  maintenance: true,
  mode: "scheduled",
  ends_at: null,
  started_at: "2026-10-09T17:41:00Z",
  window_label: null,
  progress: null,
  steps: [],
  updated_at: null,
};

let status: MaintenanceStatus = baseStatus;
const notify = vi.fn(
  (_url: string, _init?: RequestInit) =>
    new Response(JSON.stringify({ message: "ok" }), { status: 200 }),
);

function mockFetch(url: string, init?: RequestInit) {
  if (url.endsWith("/status/notify")) return Promise.resolve(notify(url, init));
  if (url.endsWith("/status")) return Promise.resolve(new Response(JSON.stringify(status)));
  return Promise.resolve(new Response("{}", { status: 503 }));
}

function renderPage(from?: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MaintenancePage from={from} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  status = baseStatus;
  loadPage.mockClear();
  notify.mockClear();
  vi.stubGlobal("fetch", vi.fn(mockFetch));
});
afterEach(() => vi.unstubAllGlobals());

describe("countdown", () => {
  it("shows minutes and seconds when under an hour", () => {
    expect(formatCountdown(48 * 60)).toEqual({
      parts: [
        { value: "48", unit: "min" },
        { value: "00", unit: "sec" },
      ],
      label: "About 48 minutes left",
    });
  });

  it("adds hours when there are any", () => {
    expect(formatCountdown(3725).parts.map((p) => `${p.value} ${p.unit}`)).toEqual([
      "01 hrs",
      "02 min",
      "05 sec",
    ]);
  });

  it("stops at zero, and the page says any minute now", async () => {
    expect(formatCountdown(-5).parts.map((p) => p.value)).toEqual(["00", "00"]);

    status = { ...baseStatus, ends_at: new Date(Date.now() - 1000).toISOString() };
    renderPage();
    expect(await screen.findByText("Any minute now")).toBeInTheDocument();
    expect(screen.getByText("Almost there")).toBeInTheDocument();
  });

  it("ticks down a live timer to ends_at", async () => {
    status = { ...baseStatus, ends_at: new Date(Date.now() + 48 * 60_000 + 500).toISOString() };
    renderPage();
    expect(await screen.findByRole("timer")).toHaveAccessibleName("About 48 minutes left");
  });
});

describe("status card", () => {
  it("marks each step done, in progress or up next", async () => {
    status = {
      ...baseStatus,
      progress: 47,
      steps: [
        { label: "Backed up listings and accounts", state: "done" },
        { label: "Upgrading map tiles", state: "active" },
        { label: "Re-checking plot boundaries", state: "next" },
      ],
    };
    renderPage();

    const row = (label: string) => screen.getByText(label).closest("li");
    expect(await screen.findByText("47% done")).toBeInTheDocument();
    expect(row("Backed up listings and accounts")).toHaveTextContent("Done");
    expect(row("Upgrading map tiles")).toHaveTextContent("In progress");
    expect(row("Re-checking plot boundaries")).toHaveTextContent("Up next");
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "47");
  });

  it("hides the details the admin didn't fill in", async () => {
    renderPage();
    await screen.findByText("We're re-surveying the map.");

    expect(screen.queryByRole("timer")).not.toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(screen.queryByText("Maintenance window")).not.toBeInTheDocument();
  });

  it("shows the window the admin entered", async () => {
    status = { ...baseStatus, window_label: "Today, 21:00 – 22:30 EAT" };
    renderPage();
    expect(await screen.findByText("Today, 21:00 – 22:30 EAT")).toBeInTheDocument();
  });

  it("uses the unplanned copy, with when it started", async () => {
    status = { ...baseStatus, mode: "unplanned" };
    renderPage();
    expect(await screen.findByText("We're fixing something.")).toBeInTheDocument();
    expect(screen.getByText("We're on it")).toBeInTheDocument();
    expect(screen.getByText("Started")).toBeInTheDocument();
  });
});

describe("notify me", () => {
  it("explains what's wrong with the email", () => {
    expect(emailError("  ")).toBe("Enter your email address.");
    expect(emailError("wanjiru@")).toBe(
      "That doesn't look like an email address. Check it and try again.",
    );
    expect(emailError("wanjiru@example.co.ke")).toBe("");
  });

  it("flags the field and links the error to it", async () => {
    renderPage();
    await userEvent.click(screen.getByRole("button", { name: "Notify me" }));

    const input = screen.getByLabelText("Get an email the moment we're back");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Enter your email address.");
    expect(notify).not.toHaveBeenCalled();
  });

  it("joins the list and offers to change the address", async () => {
    renderPage();
    await userEvent.type(
      screen.getByLabelText("Get an email the moment we're back"),
      "wanjiru@example.co.ke",
    );
    await userEvent.click(screen.getByRole("button", { name: "Notify me" }));

    expect(await screen.findByText("You're on the list.")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "We'll email wanjiru@example.co.ke when Geo Pin is back.",
    );
    expect(JSON.parse(String(notify.mock.calls[0][1]?.body))).toEqual({
      email: "wanjiru@example.co.ke",
    });

    await userEvent.click(screen.getByRole("button", { name: "Change" }));
    expect(screen.getByLabelText("Get an email the moment we're back")).toBeInTheDocument();
  });
});

describe("routing", () => {
  it("sends a 503 from any API call to the maintenance page, remembering where you were", async () => {
    window.history.pushState({}, "", "/land?parcel=7");
    await expect(api.get("/parcels")).rejects.toThrow();
    expect(loadPage).toHaveBeenCalledWith("/maintenance?from=%2Fland%3Fparcel%3D7");
    window.history.pushState({}, "", "/");
  });

  it("goes back to where you came from once /api/status says maintenance is off", async () => {
    status = { ...baseStatus, maintenance: false };
    renderPage("/land?parcel=7");
    await waitFor(() => expect(loadPage).toHaveBeenCalledWith("/land?parcel=7", true));
  });

  it("never returns to another site", () => {
    expect(safeReturnPath("//evil.example")).toBe("/");
    expect(safeReturnPath("https://evil.example")).toBe("/");
    expect(safeReturnPath(undefined)).toBe("/");
  });
});

describe("beacons", () => {
  it("keeps at most twelve, dropping the oldest", () => {
    let list: { id: number; x: number; y: number }[] = [];
    for (let id = 1; id <= 13; id++) list = addBeacon(list, { id, x: 0, y: 0 });
    expect(list).toHaveLength(MAX_BEACONS);
    expect(list[0].id).toBe(2);
  });

  it("drops beacons from the keyboard and cheers the patient", async () => {
    renderPage();
    const map = screen.getByRole("button", { name: /Map of Kenya/ });
    for (let i = 0; i < 13; i++) act(() => void fireEvent.keyDown(map, { key: "Enter" }));

    expect(screen.getAllByTestId("beacon")).toHaveLength(12);
    expect(screen.getByText("12 beacons placed · tap to add more")).toBeInTheDocument();
    expect(screen.getByText("nice pinning!")).toBeInTheDocument();
  });
});
