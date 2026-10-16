import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { BlogPost } from "@/lib/api";

const loaderData = vi.fn<() => BlogPost>();

vi.mock("@tanstack/react-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-router")>()),
  createFileRoute: () => (opts: object) => ({ ...opts, useLoaderData: () => loaderData() }),
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

const { isNotFound } = await import("@tanstack/react-router");
const { Route } = await import("@/routes/blog_.$slug");
const route = Route as unknown as {
  component: React.ComponentType;
  loader: (args: {
    params: { slug: string };
    context: { queryClient: unknown };
  }) => Promise<unknown>;
  head: (args: { loaderData?: BlogPost }) => { meta?: Record<string, string>[] };
};
const Page = route.component;

const post = (overrides: Partial<BlogPost> = {}): BlogPost => ({
  id: "1",
  slug: "check-a-plot",
  title: "How to check a plot before you pay a single shilling",
  excerpt: "A step-by-step guide.",
  category: "Verification",
  cover_url: "https://cdn.example/cover.jpg",
  read_minutes: 6,
  published_at: "2026-09-12T00:00:00Z",
  author: { name: "Wanjiku Kamau", avatar: null, avatar_color: null, bio: "Writes about land." },
  content: "<p>Intro.</p><h2>Start with the map</h2><p>One.</p><h2>Before you pay</h2><p>Two.</p>",
  related: [
    { ...relatedPost("reading-a-title", "Reading a title deed") },
    { ...relatedPost("site-visit", "Questions to ask before a site visit") },
  ],
  ...overrides,
});

function relatedPost(slug: string, title: string): BlogPost {
  return {
    id: slug,
    slug,
    title,
    excerpt: "",
    category: "Verification",
    cover_url: null,
    read_minutes: 4,
    published_at: null,
    author: null,
  };
}

describe("Blog post page", () => {
  beforeEach(() => {
    loaderData.mockReturnValue(post());
  });

  it("renders the title with its closing words accented, the byline and the author bio", () => {
    render(<Page />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("How to check a plot before you pay a single shilling");
    expect(heading.querySelector(".gs-underline")).toHaveTextContent("a single shilling");
    expect(screen.getAllByText("Wanjiku Kamau")).toHaveLength(2);
    expect(screen.getByText("Writes about land.")).toBeInTheDocument();
    expect(screen.getByText(/6 min read/)).toBeInTheDocument();
  });

  it("builds the table of contents from the article's h2 headings", () => {
    render(<Page />);
    const toc = screen.getByRole("navigation", { name: "Table of contents" });
    const links = Array.from(toc.querySelectorAll("a"));
    expect(links.map((a) => [a.textContent, a.getAttribute("href")])).toEqual([
      ["Start with the map", "#start-with-the-map"],
      ["Before you pay", "#before-you-pay"],
    ]);
    expect(document.getElementById("start-with-the-map")).toHaveTextContent("Start with the map");
    expect(links.filter((a) => a.getAttribute("aria-current") === "true")).toHaveLength(1);
  });

  it("hides the table of contents for an article without h2 headings", () => {
    loaderData.mockReturnValue(post({ content: "<p>Just a paragraph.</p>" }));
    render(<Page />);
    expect(screen.queryByRole("navigation", { name: "Table of contents" })).not.toBeInTheDocument();
  });

  it("copies the article link and shows a toast", async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    render(<Page />);

    await user.click(screen.getAllByRole("button", { name: "Copy link" })[0]);

    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/blog/check-a-plot`);
    expect(await screen.findByText("Link copied")).toBeInTheDocument();
  });

  it("links the share buttons to each platform with the article URL", () => {
    render(<Page />);
    const url = encodeURIComponent(`${window.location.origin}/blog/check-a-plot`);
    expect(screen.getAllByRole("link", { name: "Share on Facebook" })[0]).toHaveAttribute(
      "href",
      `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    );
  });

  it("thanks the reader once they vote", async () => {
    render(<Page />);
    await userEvent.click(screen.getByRole("button", { name: "Yes" }));
    expect(screen.getByRole("status")).toHaveTextContent("Asante! Glad it helped.");
    expect(screen.queryByRole("button", { name: "Not really" })).not.toBeInTheDocument();
  });

  it("lists related posts", () => {
    render(<Page />);
    expect(screen.getByRole("heading", { name: "Keep reading" })).toBeInTheDocument();
    expect(screen.getByText("Reading a title deed")).toBeInTheDocument();
    expect(screen.getByText("Questions to ask before a site visit")).toBeInTheDocument();
  });

  it("sets SEO meta from the post, using the cover as the share image", () => {
    const meta = route.head({ loaderData: post() }).meta ?? [];
    expect(meta).toContainEqual({
      title: "How to check a plot before you pay a single shilling — Geo Pin Properties Kenya",
    });
    expect(meta).toContainEqual({ name: "description", content: "A step-by-step guide." });
    expect(meta).toContainEqual({ property: "og:image", content: "https://cdn.example/cover.jpg" });
  });
});

describe("Blog post loader", () => {
  it("throws a not-found for an unknown slug", async () => {
    const queryClient = {
      ensureQueryData: vi
        .fn()
        .mockRejectedValue(Object.assign(new Error("Not found"), { status: 404 })),
    };
    const result = route.loader({ params: { slug: "nope" }, context: { queryClient } });
    await expect(result).rejects.toSatisfy(isNotFound);
  });

  it("lets other API errors through", async () => {
    const error = Object.assign(new Error("Server error"), { status: 500 });
    const queryClient = { ensureQueryData: vi.fn().mockRejectedValue(error) };
    await expect(route.loader({ params: { slug: "x" }, context: { queryClient } })).rejects.toBe(
      error,
    );
  });
});
