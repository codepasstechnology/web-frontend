import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { BlogPost, Faq } from "@/lib/api";

const faqs = vi.fn<() => Faq[]>(() => []);
const posts = vi.fn<() => BlogPost[]>(() => []);

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (opts: object) => opts,
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
vi.mock("@/lib/content", () => ({
  useFaqs: () => ({ data: faqs(), isLoading: false }),
  useBlogPosts: () => ({ data: posts(), isLoading: false }),
}));

const { Route: HelpRoute } = await import("@/routes/help");
const { Route: BlogRoute } = await import("@/routes/blog");
const Help = (HelpRoute as unknown as { component: React.ComponentType }).component;
const Blog = (BlogRoute as unknown as { component: React.ComponentType }).component;

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

describe("Help page", () => {
  beforeEach(() => {
    faqs.mockReturnValue([
      faq("1", "How do you verify a title?", "Verification"),
      faq("2", "How do I pay with M-Pesa?", "Billing"),
    ]);
  });

  it("lists FAQs in an accordion and reveals the HTML answer on click", async () => {
    render(<Help />);
    const trigger = screen.getByRole("button", { name: "How do you verify a title?" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Answer to How do you verify a title?")).toBeInTheDocument();
  });

  it("filters by search text", async () => {
    render(<Help />);
    await userEvent.type(screen.getByRole("searchbox", { name: "Search questions" }), "m-pesa");
    expect(screen.queryByText("How do you verify a title?")).not.toBeInTheDocument();
    expect(screen.getByText("How do I pay with M-Pesa?")).toBeInTheDocument();
  });

  it("filters by topic", async () => {
    render(<Help />);
    await userEvent.click(screen.getByRole("radio", { name: "Verification" }));
    expect(screen.getByText("How do you verify a title?")).toBeInTheDocument();
    expect(screen.queryByText("How do I pay with M-Pesa?")).not.toBeInTheDocument();
  });
});

describe("Blog page", () => {
  it("filters posts by category", async () => {
    posts.mockReturnValue([
      post("a", "Registry search guide", "Buying land"),
      post("b", "Nairobi rent guide", "Renting"),
    ]);
    render(<Blog />);
    expect(screen.getByText("Registry search guide")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("radio", { name: "Renting" }));
    expect(screen.queryByText("Registry search guide")).not.toBeInTheDocument();
    expect(screen.getByText("Nairobi rent guide")).toBeInTheDocument();
  });

  it("shows an empty state when nothing is published", () => {
    posts.mockReturnValue([]);
    render(<Blog />);
    expect(screen.getByText(/No articles published yet/)).toBeInTheDocument();
  });
});
