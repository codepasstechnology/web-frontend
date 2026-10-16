import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockGet = vi.fn<(path: string) => Promise<unknown>>();
let analyticsAccess = false;

vi.mock("@/lib/api", () => ({ api: { get: (p: string) => mockGet(p) } }));
vi.mock("@/lib/auth", () => ({
  useAuth: () => ({ user: { analyticsAccess, listings: [] } }),
}));
vi.mock("@/lib/plans", () => ({
  usePlans: () => ({ data: [{ id: "pro", price: 4500 }] }),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const { AnalyticsTab } = await import("@/components/dashboard/AnalyticsTab");

const today = new Date().toISOString().slice(0, 10);

const analytics = {
  total_views: 12,
  total_saves: 3,
  total_inquiries: 1,
  top_listings: [],
  listing_points: [],
  county_breakdown: [],
  recent_activity: [],
  daily_views: [{ date: today, views: 12 }],
  daily_saves: [{ date: today, saves: 3 }],
  daily_inquiries: [{ date: today, inquiries: 1 }],
  traffic_sources: [],
  device_breakdown: [],
  peak_activity: [],
  county_avg_prices: [],
  avg_days_on_market: null,
  county_percentile: null,
};

describe("AnalyticsTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue(analytics);
  });

  it("draws no chart and asks nothing of the API when locked", () => {
    analyticsAccess = false;
    const { container } = render(<AnalyticsTab onUpgrade={vi.fn()} onGoTab={vi.fn()} />);

    expect(screen.getByRole("region", { name: "Analytics locked" })).toBeInTheDocument();
    expect(container.querySelector(".recharts-wrapper")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Export/ })).toBeDisabled();
    expect(mockGet).not.toHaveBeenCalled();
  });

  it("shows the daily figures as a table on request", async () => {
    analyticsAccess = true;
    render(<AnalyticsTab onUpgrade={vi.fn()} onGoTab={vi.fn()} />);

    await userEvent.click(await screen.findByRole("button", { name: "Show as table" }));

    const table = screen.getByRole("table");
    expect(table).toHaveTextContent(today);
    expect(screen.getByRole("button", { name: "Show as chart" })).toBeInTheDocument();
  });
});
