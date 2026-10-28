import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const mockGet = vi.fn<(path: string) => Promise<unknown>>();
const mockPatch = vi.fn<(path: string, body?: unknown) => Promise<unknown>>(() =>
  Promise.resolve({}),
);
const mockPost = vi.fn<(path: string, body?: unknown) => Promise<unknown>>(() =>
  Promise.resolve({}),
);

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));
vi.mock("@/lib/api", () => ({
  api: {
    get: (path: string) => mockGet(path),
    patch: (path: string, body?: unknown) => mockPatch(path, body),
    post: (path: string, body?: unknown) => mockPost(path, body),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));
vi.mock("@/lib/auth", () => ({
  useAuth: () => ({
    user: { id: "owner-1", agency: { id: "a-1", role: "owner" } },
    reloadUser: vi.fn(),
  }),
}));

const { LeadsTab } = await import("@/components/dashboard/LeadsTab");
const { TeamTab } = await import("@/components/dashboard/TeamTab");

const myAgency = {
  id: "a-1",
  name: "Kilimani Homes",
  slug: "kilimani-homes",
  logo_url: null,
  cover_url: null,
  brand_color: null,
  tagline: null,
  about: null,
  phone: null,
  whatsapp: null,
  email: null,
  website: null,
  socials: [],
  address: null,
  latitude: null,
  longitude: null,
  office_hours: null,
  viewing_hours: null,
  areas: [],
  specialties: [],
  description_footer: null,
  watermark_photos: false,
  featured: false,
  my_role: "owner",
  members: [
    { user_id: "owner-1", name: "Owner One", role: "owner" },
    { user_id: "agent-1", name: "Jane Agent", role: "agent" },
  ],
  projects: [],
  plan: {
    name: "Agency Pro",
    slug: "agency-pro",
    is_agency_plan: true,
    team_seats: 3,
    multi_unit: 1,
    lead_inbox: 1,
    agency_insights: 1,
    boost_discount: 20,
  },
};

const viewingLead = {
  id: "lead-1",
  source: "viewing",
  status: "new",
  name: "Wanjiku Mwangi",
  email: null,
  phone: "0722000000",
  message: "Can I come on Saturday?",
  listing_type: "property",
  listing_id: "p-1",
  listing_title: "Sunrise Apartments",
  viewing_at: "2026-11-07T06:00:00Z",
  viewing_slot: "morning",
  preferred_time: "Saturday 7 November, morning (9 am – 12 pm)",
  viewing_status: "requested",
  assigned_to: null,
  assignee: null,
  responded_at: null,
  created_at: "2026-11-01T09:00:00Z",
};

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe("lead inbox", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockImplementation((path: string) => {
      if (path === "/user/agency") return Promise.resolve(myAgency);
      if (path.startsWith("/user/agency/leads"))
        return Promise.resolve({ data: [viewingLead], counts: { new: 1 } });
      if (path === "/user/agency/replies")
        return Promise.resolve([
          { id: "r-1", title: "Still available", body: "Yes, it is still available." },
        ]);
      return Promise.reject(new Error(path));
    });
  });

  it("shows a viewing request that still needs a reply, and confirms it", async () => {
    renderWithClient(<LeadsTab />);

    expect(await screen.findByText("Wanjiku Mwangi")).toBeInTheDocument();
    expect(screen.getByText("Awaiting reply")).toBeInTheDocument();
    expect(screen.getByText("Can I come on Saturday?")).toBeInTheDocument();
    expect(screen.getByText("Saturday 7 November, morning (9 am – 12 pm)")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Confirm" }));
    expect(mockPatch).toHaveBeenCalledWith("/user/agency/leads/lead-1", {
      viewing_status: "confirmed",
    });
  });

  it("shows a free agency how many leads wait behind the upgrade, without loading them", async () => {
    mockGet.mockImplementation((path: string) =>
      path === "/user/agency"
        ? Promise.resolve({ ...myAgency, new_leads: 4, plan: { ...myAgency.plan, lead_inbox: 0 } })
        : Promise.reject(new Error(path)),
    );
    renderWithClient(<LeadsTab />);

    expect(await screen.findByText("You have 4 new leads waiting")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "See agency plans" })).toBeInTheDocument();
    expect(mockGet).not.toHaveBeenCalledWith(expect.stringMatching(/^\/user\/agency\/leads/));
  });

  it("fills the reply from a saved reply", async () => {
    renderWithClient(<LeadsTab />);
    await screen.findByText("Wanjiku Mwangi");

    await userEvent.selectOptions(screen.getByLabelText("Use a saved reply"), "r-1");

    expect(screen.getByLabelText("Reply")).toHaveValue("Yes, it is still available.");
    expect(screen.getByRole("link", { name: /Reply on WhatsApp/ })).toHaveAttribute(
      "href",
      expect.stringContaining("wa.me/254722000000"),
    );
  });
});

describe("team", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockImplementation((path: string) => {
      if (path === "/user/agency") return Promise.resolve(myAgency);
      if (path === "/user/agency/team") {
        return Promise.resolve({
          seats: 3,
          members: [
            {
              id: "m-1",
              user_id: "owner-1",
              name: "Owner One",
              email: "o@kh.test",
              phone: null,
              role: "owner",
              joined_at: "2026-01-01",
              listings: 4,
            },
            {
              id: "m-2",
              user_id: "agent-1",
              name: "Jane Agent",
              email: "j@kh.test",
              phone: null,
              role: "agent",
              joined_at: "2026-02-01",
              listings: 2,
            },
          ],
          invitations: [],
        });
      }
      return Promise.reject(new Error(path));
    });
  });

  it("invites by email and role", async () => {
    renderWithClient(<TeamTab />);
    expect(await screen.findByText("Jane Agent")).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText("Email"), "new@kh.test");
    await userEvent.click(screen.getByRole("button", { name: "Manager" }));
    await userEvent.click(screen.getByRole("button", { name: /Send invitation/ }));

    expect(mockPost).toHaveBeenCalledWith("/user/agency/team/invitations", {
      email: "new@kh.test",
      role: "manager",
    });
  });

  it("explains that a removed member's listings stay with the agency", async () => {
    renderWithClient(<TeamTab />);
    await userEvent.click(await screen.findByRole("button", { name: /Remove/ }));

    expect(screen.getByText(/Their 2 listings stay with the agency/)).toBeInTheDocument();
  });
});
