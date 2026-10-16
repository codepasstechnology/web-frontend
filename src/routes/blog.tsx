import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Check } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { MARKETING_FONT_LINKS } from "@/components/site/marketingFonts";
import { MarketingShell } from "@/components/site/MarketingShell";
import { PageHero } from "@/components/site/PageHero";
import type { BlogPost } from "@/lib/api";
import { useBlogPosts } from "@/lib/content";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [{ title: "Blog — Geo Pin Properties Kenya" }],
    links: MARKETING_FONT_LINKS,
  }),
  component: BlogPage,
});

const ALL = "All";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-KE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function meta(post: BlogPost, withAuthor: boolean) {
  return [
    withAuthor && post.author?.name,
    post.published_at && formatDate(post.published_at),
    `${post.read_minutes} min read`,
  ]
    .filter(Boolean)
    .join(" · ");
}

function Thumb({ post }: { post: BlogPost }) {
  return (
    <div className="gs-thumb">
      {post.cover_url && <img src={post.cover_url} alt="" loading="lazy" />}
    </div>
  );
}

function BlogPage() {
  const { data: posts = [], isLoading } = useBlogPosts();
  const [category, setCategory] = useState(ALL);
  const [email, setEmail] = useState("");
  const [tried, setTried] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const featured = posts[0];
  const rest = posts.slice(1);
  const categories = [ALL, ...new Set(rest.map((p) => p.category).filter(Boolean))];
  const shown = category === ALL ? rest : rest.filter((p) => p.category === category);
  const emailValid = EMAIL_RE.test(email.trim());
  const emailError = tried && !emailValid ? "Enter a valid email address." : "";

  function handleSubscribe(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // No newsletter endpoint exists yet, so a valid address only shows the success state.
    if (emailValid) setSubscribed(true);
    else setTried(true);
  }

  return (
    <MarketingShell>
      <PageHero
        eyebrow="The Geo Pin blog"
        title="Field notes on"
        highlight="Kenyan land."
        lede="Practical guides on buying, verifying and renting property, written for people who want to know the ground before they sign."
      />

      <section className="gs-wrap" style={{ paddingBottom: 48 }}>
        {isLoading ? (
          <Skeleton className="h-80 w-full rounded-[28px]" />
        ) : (
          featured && (
            <Link
              to="/blog/$slug"
              params={{ slug: featured.slug }}
              className="gs-post gs-post-featured gs-lift gs-reveal"
            >
              <Thumb post={featured} />
              <div className="gs-post-body">
                <span className="gs-tag">
                  Featured{featured.category && ` · ${featured.category}`}
                </span>
                <h2
                  className="gs-h"
                  style={{ fontSize: "clamp(28px, 3vw, 42px)", lineHeight: 1.05 }}
                >
                  {featured.title}
                </h2>
                {featured.excerpt && <p className="gs-text">{featured.excerpt}</p>}
                <span className="gs-post-meta" style={{ fontSize: 14 }}>
                  {meta(featured, true)}
                </span>
              </div>
            </Link>
          )
        )}
      </section>

      <section
        className="gs-wrap"
        style={{ paddingBottom: 96, display: "flex", flexDirection: "column", gap: 32 }}
      >
        {categories.length > 1 && (
          <div className="gs-filter-row">
            <div role="group" aria-label="Filter by topic" className="gs-chips">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className="gs-chip"
                  aria-pressed={category === cat}
                  onClick={() => setCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
            <span role="status" style={{ fontSize: 14, color: "var(--muted)" }}>
              {shown.length} {shown.length === 1 ? "article" : "articles"}
            </span>
          </div>
        )}

        {isLoading ? (
          <div className="gs-posts">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-[380px] w-full rounded-[28px]" />
            ))}
          </div>
        ) : shown.length === 0 ? (
          !featured && (
            <p className="gs-text" style={{ textAlign: "center", padding: "64px 0" }}>
              No articles published yet. Check back soon.
            </p>
          )
        ) : (
          <div key={category} className="gs-posts">
            {shown.map((post, i) => (
              <Link
                key={post.slug}
                to="/blog/$slug"
                params={{ slug: post.slug }}
                className="gs-post gs-lift"
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <Thumb post={post} />
                <div className="gs-post-body">
                  {post.category && <span className="gs-tag">{post.category}</span>}
                  <h3
                    className="gs-h"
                    style={{ fontSize: 22, lineHeight: 1.15, letterSpacing: "-0.02em" }}
                  >
                    {post.title}
                  </h3>
                  <p className="gs-text" style={{ fontSize: 15, lineHeight: 1.55, flex: 1 }}>
                    {post.excerpt}
                  </p>
                  <span className="gs-post-meta">{meta(post, false)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="newsletter-title" className="gs-alt">
        <div className="gs-wrap gs-newsletter">
          <div className="gs-reveal" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <h2
              id="newsletter-title"
              className="gs-h"
              style={{ fontSize: "clamp(30px, 3.6vw, 48px)", lineHeight: 1 }}
            >
              New guides, once a month.
            </h2>
            <p className="gs-text">No spam. Just useful notes on land and property in Kenya.</p>
          </div>
          <div className="gs-reveal" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {subscribed ? (
              <div role="status" className="gs-success">
                <Check aria-hidden size={18} strokeWidth={2.4} /> You&apos;re subscribed. Karibu!
              </div>
            ) : (
              <>
                <form onSubmit={handleSubscribe} noValidate>
                  <label htmlFor="nl-email" className="gs-sr-only">
                    Email address
                  </label>
                  <input
                    id="nl-email"
                    className="gs-input"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={!!emailError}
                    aria-describedby={emailError ? "nl-error" : undefined}
                  />
                  <button type="submit" className="gs-btn" style={{ minHeight: 56 }}>
                    Subscribe
                  </button>
                </form>
                {emailError && (
                  <span id="nl-error" role="alert" className="gs-error" style={{ paddingLeft: 18 }}>
                    {emailError}
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
