import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { BlogPost, Faq } from "@/lib/api";
import type { Plan } from "@/lib/plans";

const faqs = vi.fn<() => Faq[]>(() => []);
const posts = vi.fn<() => BlogPost[]>(() => []);
const plans = vi.fn<() => Plan[]>(() => []);
const settings = vi.fn<() => Record<string, string>>(() => ({}));
const navigate = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (opts: object) => opts,
  useNavigate: () => navigate,
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
vi.mock("@/components/site/MarketingShell", () => ({
  MarketingShell: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("@/lib/auth", () => ({
  useAuth: () => ({ user: null, setPlan: vi.fn() }),
}));
vi.mock("@/lib/content", () => ({
  useFaqs: () => ({ data: faqs(), isLoading: false }),
  useBlogPosts: () => ({ data: posts(), isLoading: false }),
}));
vi.mock("@/lib/plans", () => ({
  usePlans: () => ({ data: plans() }),
}));
vi.mock("@/lib/settings", () => ({
  usePublicSettings: () => ({ data: settings() }),
}));

const routeComponent = (route: unknown) => (route as { component: React.ComponentType }).component;
const Help = routeComponent((await import("@/routes/help")).Route);
const Blog = routeComponent((await import("@/routes/blog")).Route);
const Pricing = routeComponent((await import("@/routes/pricing")).Route);
const Contact = routeComponent((await import("@/routes/contact")).Route);

const faq = (id: string, question: string, category: string): Faq => ({
  id,
  question,
  answer: `<p>Answer to ${question}</p>`,
  category,
});

const post = (id: string, title: string, category: string): BlogPost => ({
  id,
  slug: id,
  title,
  excerpt: "",
  category,
  cover_url: null,
  read_minutes: 4,
  published_at: null,
  author: null,
});

const plan = (
  name: string,
  price: number,
  priceYearly: number | null,
  features: string[],
  extra: Partial<Plan> = {},
): Plan => ({
  id: name.toLowerCase(),
  name,
  price,
  priceYearly,
  listings: 10,
  photos: 10,
  documents: 6,
  cta: `Choose ${name}`,
  features,
  ...extra,
});

describe("Help page", () => {
  beforeEach(() => {
    faqs.mockReturnValue([
      faq("1", "How do you verify a title?", "Verification"),
      faq("2", "How do I pay with M-Pesa?", "Billing"),
    ]);
  });

  it("shows the topic grid by default with the popular questions list", () => {
    render(<Help />);
    expect(screen.getByRole("button", { name: /Verification/ })).toBeInTheDocument();
    expect(screen.getByText("How do you verify a title?")).toBeInTheDocument();
    expect(screen.getByText("How do I pay with M-Pesa?")).toBeInTheDocument();
  });

  it("lists FAQs in an accordion and reveals the HTML answer on click", async () => {
    render(<Help />);
    const trigger = screen.getByRole("button", { name: "How do you verify a title?" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Answer to How do you verify a title?")).toBeInTheDocument();
  });

  it("filters by search text and switches to the filtered view", async () => {
    render(<Help />);
    await userEvent.type(screen.getByRole("searchbox", { name: "Search help articles" }), "m-pesa");
    expect(screen.queryByText("How do you verify a title?")).not.toBeInTheDocument();
    expect(screen.getByText("How do I pay with M-Pesa?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show all topics" })).toBeInTheDocument();
  });

  it("searches answer text but not the HTML tags around it", async () => {
    render(<Help />);
    const search = screen.getByRole("searchbox", { name: "Search help articles" });
    await userEvent.type(search, "answer to how do i pay");
    expect(screen.getByText("How do I pay with M-Pesa?")).toBeInTheDocument();
    expect(screen.queryByText("How do you verify a title?")).not.toBeInTheDocument();

    await userEvent.clear(search);
    await userEvent.type(search, "<p>");
    expect(screen.getByText("hmm, nothing matched that.")).toBeInTheDocument();
  });

  it("filters by topic when a topic card is clicked, and resets on 'Show all topics'", async () => {
    render(<Help />);
    await userEvent.click(screen.getByRole("button", { name: /Verification/ }));
    expect(screen.getByText("How do you verify a title?")).toBeInTheDocument();
    expect(screen.queryByText("How do I pay with M-Pesa?")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Show all topics" }));
    expect(screen.getByText("How do you verify a title?")).toBeInTheDocument();
    expect(screen.getByText("How do I pay with M-Pesa?")).toBeInTheDocument();
  });

  it("shows an empty state when nothing matches the search", async () => {
    render(<Help />);
    await userEvent.type(
      screen.getByRole("searchbox", { name: "Search help articles" }),
      "nonexistent",
    );
    expect(screen.getByText("hmm, nothing matched that.")).toBeInTheDocument();
  });
});

describe("Blog page", () => {
  it("filters posts by category and updates the article count", async () => {
    posts.mockReturnValue([
      post("f", "Verifying land ownership basics", "Guides"),
      post("a", "Registry search guide", "Buying land"),
      post("b", "Nairobi rent guide", "Renting"),
    ]);
    render(<Blog />);
    expect(screen.getByText("Registry search guide")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("2 articles");

    const renting = screen.getByRole("button", { name: "Renting" });
    await userEvent.click(renting);
    expect(renting).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByText("Registry search guide")).not.toBeInTheDocument();
    expect(screen.getByText("Nairobi rent guide")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("1 article");
  });

  it("shows an empty state when nothing is published", () => {
    posts.mockReturnValue([]);
    render(<Blog />);
    expect(screen.getByText(/No articles published yet/)).toBeInTheDocument();
  });

  it("validates the newsletter email before showing the subscribed state", async () => {
    posts.mockReturnValue([]);
    render(<Blog />);
    const input = screen.getByLabelText("Email address");
    await userEvent.type(input, "not-an-email");
    await userEvent.click(screen.getByRole("button", { name: "Subscribe" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Enter a valid email address.");
    expect(input).toHaveAttribute("aria-invalid", "true");

    await userEvent.clear(input);
    await userEvent.type(input, "wanjiku@example.com");
    await userEvent.click(screen.getByRole("button", { name: "Subscribe" }));
    expect(screen.getByText(/You're subscribed/)).toBeInTheDocument();
  });
});

describe("Pricing page", () => {
  beforeEach(() => {
    navigate.mockClear();
    faqs.mockReturnValue([]);
    plans.mockReturnValue([
      plan("Free", 0, 0, ["3 active listings", "Standard KYC review"], { listings: 3 }),
      plan("Basic", 1500, 13500, ["10 active listings", "Standard KYC review"], {
        badge: { label: "Most Popular", color: "accent" },
      }),
      plan("Pro", 4500, 40500, ["Unlimited active listings", "API access"], {
        listings: Infinity,
      }),
      plan("Enterprise", 15000, 135000, ["Unlimited active listings", "API access"], {
        listings: Infinity,
      }),
    ]);
  });

  it("swaps monthly prices for yearly ones and shows the saving from the data", async () => {
    render(<Pricing />);
    expect(screen.getByText("KES 1,500")).toBeInTheDocument();
    expect(screen.getByText("Most Popular")).toBeInTheDocument();

    const yearly = screen.getByRole("button", { name: /Yearly/ });
    expect(yearly).toHaveTextContent("3 months free");
    await userEvent.click(yearly);
    expect(yearly).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("KES 13,500")).toBeInTheDocument();
    expect(screen.queryByText("KES 1,500")).not.toBeInTheDocument();
  });

  it("shows plans beyond the first three as a contact band and in the comparison table", () => {
    render(<Pricing />);
    expect(screen.getAllByRole("article")).toHaveLength(3);
    expect(screen.getByRole("link", { name: /Talk to us/ })).toHaveAttribute("href", "/contact");
    expect(screen.getByRole("columnheader", { name: "Enterprise" })).toBeInTheDocument();
    expect(screen.getByRole("rowheader", { name: "API access" })).toBeInTheDocument();
    expect(screen.queryByRole("rowheader", { name: "10 active listings" })).not.toBeInTheDocument();
  });

  it("sends visitors without an account to register when they choose a plan", async () => {
    render(<Pricing />);
    await userEvent.click(screen.getByRole("button", { name: "Choose Basic" }));
    expect(navigate).toHaveBeenCalledWith({ to: "/register" });
  });
});

describe("Contact page", () => {
  beforeEach(() => {
    settings.mockReturnValue({});
  });

  it("flags every invalid field on submit", async () => {
    render(<Contact />);
    await userEvent.click(screen.getByRole("button", { name: /Send message/ }));
    expect(screen.getByText("Enter your name.")).toBeInTheDocument();
    expect(screen.getByText("Enter a valid email address.")).toBeInTheDocument();
    expect(screen.getByLabelText("Message")).toHaveAttribute("aria-invalid", "true");
  });

  it("sends a valid message and thanks the sender by first name", async () => {
    render(<Contact />);
    await userEvent.type(screen.getByLabelText("Your name"), "Wanjiku Kamau");
    await userEvent.type(screen.getByLabelText("Email"), "wanjiku@example.com");
    await userEvent.type(screen.getByLabelText("Message"), "Is plot 42 still available?");
    await userEvent.click(screen.getByRole("button", { name: /Send message/ }));

    expect(screen.getByRole("img", { name: "Sending" })).toBeInTheDocument();
    expect(await screen.findByText("Asante, Wanjiku!", {}, { timeout: 2000 })).toBeInTheDocument();
  });

  it("links the support email from public settings, falling back to the placeholder", () => {
    const { unmount } = render(<Contact />);
    expect(screen.getByText("[EMAIL ADDRESS]")).toBeInTheDocument();
    unmount();

    settings.mockReturnValue({ support_email: "help@geopin.co.ke" });
    render(<Contact />);
    expect(screen.getByRole("link", { name: /help@geopin\.co\.ke/ })).toHaveAttribute(
      "href",
      "mailto:help@geopin.co.ke",
    );
  });
});
