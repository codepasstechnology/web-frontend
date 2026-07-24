import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, ArrowRight, Calendar, User } from "lucide-react";

export const Route = createFileRoute("/blog")({
  head: () => ({ meta: [{ title: "Blog — Geo Properties Kenya" }] }),
  component: BlogPage,
});

const posts = [
  {
    slug: "how-to-verify-land-title",
    category: "Guides",
    title: "How to Verify a Land Title Deed in Kenya (2025 Guide)",
    excerpt:
      "A step-by-step walkthrough of the official process — and how Geo Properties speeds it up from weeks to minutes.",
    author: "Geo Properties Team",
    date: "June 12, 2025",
    readTime: "6 min read",
  },
  {
    slug: "common-land-scams-kenya",
    category: "Awareness",
    title: "5 Common Land Scams in Kenya and How to Spot Them",
    excerpt:
      "Double allocation, fake title deeds, boundary manipulation — we break down the red flags buyers must know.",
    author: "Geo Properties Team",
    date: "May 28, 2025",
    readTime: "8 min read",
  },
  {
    slug: "understanding-land-tenure",
    category: "Education",
    title: "Understanding Land Tenure Systems in Kenya",
    excerpt:
      "Freehold, leasehold, community land — what each type means for buyers, sellers, and developers.",
    author: "Geo Properties Team",
    date: "May 10, 2025",
    readTime: "5 min read",
  },
  {
    slug: "digital-land-registry",
    category: "Industry",
    title: "Kenya's Digital Land Registry: Where We Are in 2025",
    excerpt:
      "Kenya's land registry is going digital. Here's what it means for property transactions in 2025.",
    author: "Geo Properties Team",
    date: "April 22, 2025",
    readTime: "4 min read",
  },
  {
    slug: "due-diligence-checklist",
    category: "Guides",
    title: "The Complete Due Diligence Checklist Before Buying Land",
    excerpt:
      "Everything from search certificates to survey maps — download our checklist and never miss a step.",
    author: "Geo Properties Team",
    date: "April 5, 2025",
    readTime: "7 min read",
  },
  {
    slug: "stamp-duty-explained",
    category: "Finance",
    title: "Stamp Duty on Land in Kenya: What You'll Pay and When",
    excerpt:
      "Rates, exemptions, and the exact process for paying stamp duty through the eCitizen portal.",
    author: "Geo Properties Team",
    date: "March 18, 2025",
    readTime: "5 min read",
  },
];

const categories = ["All", "Guides", "Awareness", "Education", "Industry", "Finance"];

function BlogPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="border-b border-border bg-muted/30 py-16">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
            <BookOpen className="h-3.5 w-3.5" />
            Geo Properties Blog
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            Land buying, demystified
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
            Guides, industry news, and practical tips to help Kenyans buy, sell, and verify land
            with confidence.
          </p>
        </div>
      </section>

      {/* Category filter */}
      <div className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-3">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                cat === "All"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Posts grid */}
      <main className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <article
              key={post.slug}
              className="group flex flex-col rounded-xl border border-border bg-card transition-shadow hover:shadow-md"
            >
              {/* Placeholder image */}
              <div className="h-44 rounded-t-xl bg-muted" />

              <div className="flex flex-1 flex-col p-5">
                <span className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">
                  {post.category}
                </span>
                <h2 className="flex-1 text-base font-semibold leading-snug text-foreground group-hover:text-primary">
                  {post.title}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>

                <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {post.date}
                    </span>
                    <span>{post.readTime}</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Newsletter CTA */}
        <div className="mt-16 rounded-2xl border border-border bg-muted/40 px-6 py-10 text-center">
          <h3 className="text-xl font-semibold text-foreground">Get new articles in your inbox</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            One email a week — no spam, unsubscribe any time.
          </p>
          <form className="mx-auto mt-5 flex max-w-sm gap-2">
            <input
              type="email"
              placeholder="you@example.com"
              className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
            />
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-secondary"
            >
              Subscribe
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
