import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BookOpen, ArrowRight, Calendar } from "lucide-react";
import { api, type BlogPost, type Paginated } from "@/lib/api";

export const Route = createFileRoute("/blog")({
  head: () => ({ meta: [{ title: "Blog — Geo Properties Kenya" }] }),
  component: BlogPage,
});

const ALL = "All";

function formatDate(value: string | null): string {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-KE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(ALL);

  useEffect(() => {
    api
      .get<Paginated<BlogPost>>("/blog")
      .then((res) => setPosts(res.data))
      .finally(() => setLoading(false));
  }, []);

  const categories = [ALL, ...Array.from(new Set(posts.map((p) => p.category).filter(Boolean)))];
  const filtered = category === ALL ? posts : posts.filter((p) => p.category === category);

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
      {categories.length > 1 && (
        <div className="border-b border-border bg-background">
          <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-3">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  cat === category
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Posts grid */}
      <main className="mx-auto max-w-6xl px-4 py-12">
        {loading ? (
          <p className="py-16 text-center text-sm text-muted-foreground">Loading articles…</p>
        ) : filtered.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            No articles published yet. Check back soon.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((post) => (
              <Link
                key={post.slug}
                to="/blog/$slug"
                params={{ slug: post.slug }}
                className="group flex flex-col rounded-xl border border-border bg-card transition-shadow hover:shadow-md"
              >
                {post.cover_url ? (
                  <img
                    src={post.cover_url}
                    alt=""
                    className="h-44 w-full rounded-t-xl object-cover"
                  />
                ) : (
                  <div className="h-44 rounded-t-xl bg-muted" />
                )}

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
                        {formatDate(post.published_at)}
                      </span>
                      <span>{post.read_minutes} min read</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

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
