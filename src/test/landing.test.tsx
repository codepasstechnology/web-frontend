import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ParcelSummary } from "@/lib/parcels";
import type { Property } from "@/lib/properties";
import type { Plan } from "@/lib/plans";
import type { BlogPost, Faq } from "@/lib/api";

const parcels = vi.fn<() => ParcelSummary[]>(() => []);
const properties = vi.fn<() => Property[]>(() => []);
const plans = vi.fn<() => Plan[]>(() => []);
const faqs = vi.fn<() => Faq[]>(() => []);
const posts = vi.fn<() => BlogPost[]>(() => []);

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (opts: object) => opts,
  Link: ({
    to,
    search,
    params,
    children,
    className,
  }: {
    to: string;
    search?: Record<string, string | undefined>;
    params?: Record<string, string>;
    children: React.ReactNode;
    className?: string;
  }) => {
    const path = to.replace(/\$(\w+)/g, (_, k: string) => params?.[k] ?? "");
    const qs = new URLSearchParams(
      Object.entries(search ?? {}).filter((e): e is [string, string] => e[1] !== undefined),
    ).toString();
    return (
      <a href={qs ? `${path}?${qs}` : path} className={className}>
        {children}
      </a>
    );
  },
}));
vi.mock("@/lib/parcels", () => ({ usePublicParcels: () => ({ data: parcels() }) }));
vi.mock("@/lib/plans", () => ({ usePlans: () => ({ data: plans() }) }));
vi.mock("@/lib/content", () => ({
  useFaqs: () => ({ data: faqs() }),
  useBlogPosts: () => ({ data: posts() }),
}));
vi.mock("@/lib/properties", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/properties")>();
  return { ...actual, usePublicProperties: () => ({ data: properties() }) };
});

const { Route } = await import("@/routes/index");
const Index = (Route as unknown as { component: React.ComponentType }).component;

const parcel: ParcelSummary = {
  id: "p1",
  parcelNumber: "KAJ/KTG/4521",
  county: "Kajiado",
  price: 1850000,
  listingType: "sale",
  verified: true,
  featured: true,
  coverPhotoUrl: null,
};

describe("Landing page", () => {
  beforeEach(() => {
    parcels.mockReturnValue([]);
    properties.mockReturnValue([]);
    plans.mockReturnValue([]);
    faqs.mockReturnValue([]);
    posts.mockReturnValue([]);
  });

  it("always renders the hero, marketplaces, verification and closing CTA", () => {
    render(<Index />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Two marketplaces, one map" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "How we verify every listing" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Find. Connect. Own." })).toBeInTheDocument();
  });

  it("hides data-driven sections when their queries return nothing", () => {
    render(<Index />);
    expect(screen.queryByText("Latest listings")).not.toBeInTheDocument();
    expect(screen.queryByText("Simple plans for sellers and agents")).not.toBeInTheDocument();
    expect(screen.queryByText("Frequently asked questions")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Guides" })).not.toBeInTheDocument();
  });

  it("shows real counts in the hero and links listing cards to the map", () => {
    parcels.mockReturnValue([parcel]);
    render(<Index />);
    expect(screen.getByText("Parcels mapped").nextSibling).toHaveTextContent("1");
    const cardLinks = screen
      .getAllByRole("link")
      .filter((a) => a.getAttribute("href") === "/land?parcel=p1");
    expect(cardLinks.length).toBeGreaterThan(0);
    expect(screen.getByText("KES 1,850,000")).toBeInTheDocument();
  });

  it("renders plans, FAQs and guides from the API", () => {
    plans.mockReturnValue([
      {
        id: "agent",
        name: "Agent",
        price: 2500,
        priceYearly: null,
        listings: 25,
        photos: 10,
        documents: 5,
        cta: "Choose Agent",
        badge: { label: "Most popular", color: "accent" },
        features: ["Verified badge"],
      },
    ]);
    faqs.mockReturnValue([
      { id: "f1", question: "How do you verify?", answer: "Registry search.", category: "x" },
    ]);
    posts.mockReturnValue([
      {
        id: "b1",
        slug: "land-search",
        title: "How to run a land search",
        excerpt: "",
        category: "Buying land",
        cover_url: null,
        read_minutes: 6,
        published_at: null,
        author: null,
      },
    ]);
    render(<Index />);
    expect(screen.getByText("Most popular")).toBeInTheDocument();
    expect(screen.getByText("How do you verify?")).toBeInTheDocument();
    expect(screen.getByText("How to run a land search").closest("a")).toHaveAttribute(
      "href",
      "/blog/land-search",
    );
  });
});
