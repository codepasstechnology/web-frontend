import React from "react";
import { readFileSync } from "node:fs";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { openStatus } from "@/components/agency/page/helpers";

const mockGet = vi.fn<(path: string) => Promise<unknown>>();
const mockPost = vi.fn<(path: string, body?: unknown) => Promise<unknown>>(() =>
  Promise.resolve({}),
);
const signedIn = { id: "u-1", fullName: "Achieng Otieno", phone: "0722111222" };
const mockUser = vi.fn<() => object | null>(() => signedIn);

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (opts: object) => ({
    ...opts,
    useParams: () => ({ slug: "kilimani-homes" }),
  }),
  notFound: () => new Error("not found"),
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));
vi.mock("@/components/site/MarketingShell", () => ({
  MarketingShell: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("@/components/map/LazyMaps", () => ({ AgencyListingsMap: () => <div>map</div> }));
vi.mock("@/lib/api", () => ({
  api: {
    get: (path: string) => mockGet(path),
    post: (path: string, body?: unknown) => mockPost(path, body),
  },
  API_BASE: "https://api.test",
}));
vi.mock("@/lib/auth", () => ({ useAuth: () => ({ user: mockUser() }) }));

// jsdom has no layout, so scrolling to the listings is a no-op here.
Element.prototype.scrollIntoView = vi.fn();

const { Route } = await import("@/routes/agency.$slug");
const AgencyPage = (Route as unknown as { component: React.ComponentType }).component;

const profile = {
  id: "a-1",
  name: "Kilimani Homes & Property Management Ltd",
  slug: "kilimani-homes",
  logo_url: null,
  brand_color: "#2D5C9C",
  tagline: "Homes across Nairobi",
  about: `${"We let and sell homes across Nairobi and Kiambu. ".repeat(6)}\n\nSecond paragraph about our team.`,
  cover_url: null,
  phone: "0712345678",
  whatsapp: null,
  email: "hello@kh.test",
  website: null,
  socials: [],
  address: null,
  latitude: null,
  longitude: null,
  office_hours: null,
  hours: [{ days: [1, 2, 3, 4, 5], open: "08:30", close: "17:30" }],
  viewing_hours: "Mon – Sat, 9 am – 5 pm",
  areas: ["Nairobi", "Kiambu", "Kajiado"],
  specialties: ["rentals"],
  featured: true,
  member_since: "2025-03-10",
  stats: {
    listings: 4,
    land: 1,
    traced: 0,
    by_type: { apartment: 1, house: 1, townhouse: 1 },
    units: 0,
    available_units: 0,
    counties: 3,
    projects: 1,
    days_to_close: null,
  },
  projects: [
    { id: "pr-1", name: "Riverside Gardens", location: "Kilimani", description: null, listings: 1 },
  ],
  reviews_enabled: true,
  rating: 4.5,
  reviews: 2,
  response_minutes: 30,
};

function property(over: Record<string, unknown>) {
  return {
    id: "p-1",
    reference_number: "PRP-1",
    title: "Sunrise Apartments",
    description: "",
    county: "Nairobi",
    area: "Kilimani",
    intent: "rent",
    type: "apartment",
    price: 45000,
    price_period: "month",
    status: "available",
    min_nights: null,
    cleaning_fee: null,
    bedrooms: 1,
    bathrooms: 1,
    furnished: false,
    amenities: [],
    posted_by: "broker",
    agent_name: "",
    agent_phone: "",
    agent_agency: "Kilimani Homes",
    latitude: -1.29,
    longitude: 36.78,
    photos: [],
    featured: false,
    project: null,
    closed_days: null,
    ...over,
  };
}

const live = {
  properties: [
    property({ id: "p-1", project: "Riverside Gardens" }),
    property({
      id: "p-2",
      title: "Ruiru family house",
      county: "Kiambu",
      area: "Ruiru",
      type: "house",
      bedrooms: 3,
      price: 65000,
    }),
    property({
      id: "p-3",
      title: "Lavington townhouse",
      intent: "sale",
      type: "townhouse",
      area: "Lavington",
      bedrooms: 4,
      price: 28_500_000,
      price_period: "total",
    }),
  ],
  parcels: [
    {
      id: "l-1",
      parcel_number: "KAJ/KTG/4521",
      size: "1/8 acre",
      county: "Kajiado",
      area: "Kitengela",
      listing_type: "sale",
      price: 1_450_000,
      latitude: -1.47,
      longitude: 36.96,
      photos: [],
      status: "available",
      closed_days: null,
    },
  ],
};

const closed = {
  properties: [property({ id: "p-9", title: "Westlands studio", status: "taken", closed_days: 9 })],
  parcels: [],
};

function reviewsResponse(over: Record<string, unknown> = {}) {
  return {
    data: [
      {
        id: "r-1",
        rating: 5,
        body: "Walked every boundary with us.",
        author: "Achieng",
        reply: "Thank you!",
        replied_at: null,
        created_at: "2026-10-12T10:00:00Z",
        context: "viewing",
      },
    ],
    can_review: true,
    my_review: null,
    distribution: { 5: 1, 4: 1, 3: 0, 2: 0, 1: 0 },
    rating: 4.5,
    reviews: 2,
    response_minutes: 30,
    ...over,
  };
}

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <AgencyPage />
    </QueryClientProvider>,
  );
}

const grid = () => document.querySelector(".ag-grid") as HTMLElement;

describe("agency page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser.mockReturnValue(signedIn);
    mockGet.mockImplementation((path: string) => {
      if (path === "/agencies/kilimani-homes") return Promise.resolve(profile);
      if (path === "/agencies/kilimani-homes/listings?tab=all") return Promise.resolve(live);
      if (path === "/agencies/kilimani-homes/listings?tab=closed") return Promise.resolve(closed);
      if (path === "/agencies/kilimani-homes/reviews") return Promise.resolve(reviewsResponse());
      return Promise.reject(new Error(`unexpected ${path}`));
    });
  });

  it("shows the brand and hides stats that are zero", async () => {
    renderPage();

    expect(
      await screen.findByRole("heading", { level: 1, name: profile.name }),
    ).toBeInTheDocument();
    expect(screen.getByText("Featured agency")).toBeInTheDocument();
    const stats = screen.getByLabelText("Agency at a glance");
    expect(within(stats).getByText("Live listings")).toBeInTheDocument();
    expect(within(stats).getByText("Projects")).toBeInTheDocument();
    expect(within(stats).queryByText("Units available")).not.toBeInTheDocument();
    expect(within(stats).queryByText("Typical time to let")).not.toBeInTheDocument();
  });

  it("clamps About until Read more", async () => {
    renderPage();
    await screen.findByRole("heading", { level: 1 });

    expect(screen.queryByText("Second paragraph about our team.")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Read more" }));
    expect(screen.getByText("Second paragraph about our team.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show less" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("counts each tab and filters by it", async () => {
    renderPage();
    await screen.findByText("Sunrise Apartments");

    const tabs = screen.getByRole("tablist", { name: "Listing type" });
    expect(within(tabs).getByRole("tab", { name: "For rent 2" })).toBeInTheDocument();
    expect(within(tabs).getByRole("tab", { name: "Land 1" })).toBeInTheDocument();
    expect(within(tabs).queryByRole("tab", { name: /BnB/ })).not.toBeInTheDocument();

    await userEvent.click(within(tabs).getByRole("tab", { name: "Land 1" }));
    expect(within(grid()).getByText("KAJ/KTG/4521")).toBeInTheDocument();
    expect(within(grid()).queryByText("Sunrise Apartments")).not.toBeInTheDocument();

    await userEvent.click(within(tabs).getByRole("tab", { name: "Recently let or sold 1" }));
    expect(screen.getByText("Let in 9 days")).toBeInTheDocument();
    expect(screen.getByText("1 listing let or sold in the last 6 months")).toBeInTheDocument();
  });

  it("filters by bedrooms and maximum price, then clears", async () => {
    renderPage();
    await screen.findByText("Sunrise Apartments");

    await userEvent.click(
      within(screen.getByRole("group", { name: "Bedrooms" })).getByRole("button", { name: "3+" }),
    );
    expect(within(grid()).getByText("Ruiru family house")).toBeInTheDocument();
    expect(within(grid()).queryByText("Sunrise Apartments")).not.toBeInTheDocument();

    await userEvent.selectOptions(screen.getByLabelText("Max price"), "100000");
    expect(within(grid()).getByText("Ruiru family house")).toBeInTheDocument();
    expect(within(grid()).queryByText("Lavington townhouse")).not.toBeInTheDocument();

    await userEvent.selectOptions(screen.getByLabelText("Max price"), "50000");
    expect(screen.getByText("No listings match these filters right now.")).toBeInTheDocument();
    await userEvent.click(screen.getAllByRole("button", { name: "Clear filters" })[0]);
    expect(within(grid()).getByText("Sunrise Apartments")).toBeInTheDocument();
  });

  it("filters to a project from its card and to a county from its pill", async () => {
    renderPage();
    await screen.findByText("Sunrise Apartments");

    await userEvent.click(screen.getByRole("button", { name: /Riverside Gardens/ }));
    expect(within(grid()).getAllByRole("article")).toHaveLength(1);
    expect(screen.getByRole("button", { name: /Showing its 1 listings/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await userEvent.click(screen.getByRole("button", { name: "Remove filter: Riverside Gardens" }));
    await userEvent.click(screen.getByRole("button", { name: "Kiambu" }));
    expect(within(grid()).getByText("Ruiru family house")).toBeInTheDocument();
    expect(within(grid()).getAllByRole("article")).toHaveLength(1);
  });

  it("puts the listing and the page link in the WhatsApp message", async () => {
    renderPage();
    await screen.findByText("Sunrise Apartments");

    const wa = screen.getByRole("link", {
      name: `Ask ${profile.name} about Sunrise Apartments on WhatsApp`,
    });
    const text = decodeURIComponent(wa.getAttribute("href") ?? "");
    expect(wa.getAttribute("href")).toMatch(/^https:\/\/wa\.me\/254712345678\?text=/);
    expect(text).toContain("Sunrise Apartments (PRP-1) in Kilimani");
    expect(text).toContain("/agency/kilimani-homes");
  });

  it("keeps Post disabled until a star is picked", async () => {
    renderPage();
    const stars = await screen.findByRole("radiogroup", { name: "Your rating" });
    const post = screen.getByRole("button", { name: "Post review" });
    expect(post).toBeDisabled();

    await userEvent.click(within(stars).getByRole("radio", { name: /4 stars/ }));
    expect(within(stars).getByRole("radio", { name: /4 stars/ })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(post).toBeEnabled();
    await userEvent.click(post);
    expect(mockPost).toHaveBeenCalledWith("/agencies/kilimani-homes/reviews", {
      rating: 4,
      body: "",
    });
    expect(await screen.findByText("Thanks, your review is posted.")).toBeInTheDocument();
  });

  it("shows the review context, and Report only to signed-in visitors", async () => {
    renderPage();
    expect(await screen.findByText("Booked a viewing")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Report" })).toBeInTheDocument();
  });

  it("hides Report from signed-out visitors and asks them to sign in", async () => {
    mockUser.mockReturnValue(null);
    mockGet.mockImplementation((path: string) => {
      if (path === "/agencies/kilimani-homes") return Promise.resolve(profile);
      if (path.includes("/listings")) return Promise.resolve({ properties: [], parcels: [] });
      return Promise.resolve(reviewsResponse({ can_review: false }));
    });
    renderPage();

    expect(await screen.findByText("Walked every boundary with us.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Report" })).not.toBeInTheDocument();
    expect(
      screen.getByText("Sign in after messaging them or booking a viewing to leave a review."),
    ).toBeInTheDocument();
    expect(screen.getByText("No listings yet")).toBeInTheDocument();
  });

  it("fills in a signed-in visitor's name and phone", async () => {
    renderPage();
    await screen.findByText("Sunrise Apartments");
    await userEvent.click(screen.getAllByRole("button", { name: "Book a viewing" })[0]);

    const dialog = screen.getByRole("dialog", { name: "Book a viewing" });
    expect(within(dialog).getByLabelText("Your name")).toHaveValue("Achieng");
    expect(within(dialog).getByLabelText("Phone")).toHaveValue("0722111222");
  });

  it("checks the viewing form before sending it", async () => {
    mockUser.mockReturnValue(null);
    renderPage();
    await screen.findByText("Sunrise Apartments");
    await userEvent.click(screen.getAllByRole("button", { name: "Book a viewing" })[0]);

    const dialog = screen.getByRole("dialog", { name: "Book a viewing" });
    await userEvent.click(within(dialog).getByRole("button", { name: "Send viewing request" }));
    expect(within(dialog).getByRole("alert")).toHaveTextContent(
      "Add your name so they know who to expect.",
    );

    await userEvent.type(within(dialog).getByLabelText("Your name"), "Wanjiru");
    await userEvent.type(within(dialog).getByLabelText("Phone"), "0712 345");
    await userEvent.click(within(dialog).getByRole("button", { name: "Send viewing request" }));
    expect(within(dialog).getByRole("alert")).toHaveTextContent(
      "Enter a Kenyan mobile number, like 0712 345 678.",
    );
    expect(mockPost).not.toHaveBeenCalledWith(
      "/agencies/kilimani-homes/viewing-requests",
      expect.anything(),
    );

    await userEvent.type(within(dialog).getByLabelText("Phone"), " 678");
    await userEvent.click(within(dialog).getByRole("button", { name: "Send viewing request" }));
    expect(mockPost).toHaveBeenCalledWith(
      "/agencies/kilimani-homes/viewing-requests",
      expect.objectContaining({ name: "Wanjiru", phone: "0712345678", slot: "morning" }),
    );
    expect(await within(dialog).findByText("Request sent")).toBeInTheDocument();
  });

  it("slides the contact bar up once the visitor scrolls", async () => {
    renderPage();
    await screen.findByRole("heading", { level: 1 });
    const bar = document.querySelector(".ag-sticky") as HTMLElement;
    expect(bar).toHaveAttribute("data-show", "false");

    act(() => {
      Object.defineProperty(window, "scrollY", { value: 600, configurable: true });
      fireEvent.scroll(window);
    });
    expect(bar).toHaveAttribute("data-show", "true");
    Object.defineProperty(window, "scrollY", { value: 0, configurable: true });
  });
});

describe("office hours", () => {
  const hours = [{ days: [1, 2, 3, 4, 5], open: "08:30", close: "17:30" }];

  it("is open from opening time and closed from closing time, in Nairobi", () => {
    // Monday 3 Nov 2026; Nairobi is UTC+3.
    expect(openStatus(hours, new Date("2026-11-02T05:29:00Z")).text).toBe("Closed · opens 8:30 am");
    expect(openStatus(hours, new Date("2026-11-02T05:30:00Z"))).toMatchObject({
      open: true,
      text: "Open now · closes 5:30 pm",
    });
    expect(openStatus(hours, new Date("2026-11-02T14:29:00Z")).open).toBe(true);
    expect(openStatus(hours, new Date("2026-11-02T14:30:00Z")).text).toBe(
      "Closed · opens tomorrow 8:30 am",
    );
    expect(openStatus(hours, new Date("2026-11-07T10:00:00Z")).text).toBe(
      "Closed · opens Monday 8:30 am",
    );
  });
});

describe("agency page styles", () => {
  it("takes every colour from the theme tokens, apart from cream on brand colours", () => {
    const css = readFileSync("src/components/agency/agency-page.css", "utf8");
    const outsideTokens = css.replace(/\.ag-page \{[^}]*\}|html\.dark \.ag-page \{[^}]*\}/g, "");
    const hexes = outsideTokens.match(/#[0-9a-f]{3,8}\b/gi) ?? [];
    expect(new Set(hexes.map((h) => h.toLowerCase()))).toEqual(new Set(["#fffaf2"]));
  });
});
