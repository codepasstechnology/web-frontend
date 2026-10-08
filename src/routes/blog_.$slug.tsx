import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Facebook,
  Link2,
  MessageSquare,
  ThumbsDown,
  ThumbsUp,
  X,
} from "lucide-react";
import { MARKETING_FONT_LINKS } from "@/components/site/marketingFonts";
import { MarketingShell } from "@/components/site/MarketingShell";
import type { BlogPost } from "@/lib/api";
import { articleOutline } from "@/lib/articleOutline";
import { blogPostQuery } from "@/lib/content";

export const Route = createFileRoute("/blog_/$slug")({
  loader: async ({ params, context }) => {
    try {
      return await context.queryClient.ensureQueryData(blogPostQuery(params.slug));
    } catch (error) {
      if ((error as { status?: number }).status === 404) throw notFound();
      throw error;
    }
  },
  head: ({ loaderData: post }) => {
    if (!post) return {};
    const title = `${post.title} — Geo Pin Properties Kenya`;
    return {
      meta: [
        { title },
        { name: "description", content: post.excerpt },
        { property: "og:type", content: "article" },
        { property: "og:title", content: title },
        { property: "og:description", content: post.excerpt },
        ...(post.cover_url
          ? [
              { property: "og:image", content: post.cover_url },
              { name: "twitter:image", content: post.cover_url },
            ]
          : []),
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: post.excerpt },
      ],
      links: MARKETING_FONT_LINKS,
    };
  },
  component: BlogPostPage,
});

const TOAST_MS = 2200;

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-KE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function postMeta(post: BlogPost) {
  return [post.published_at && formatDate(post.published_at), `${post.read_minutes} min read`]
    .filter(Boolean)
    .join(" · ");
}

/** The title's closing words get the accent colour and the inked underline. */
function splitTitle(title: string): [string, string] {
  const words = title.trim().split(/\s+/);
  const accent = words.length > 4 ? 3 : 1;
  return [words.slice(0, -accent).join(" "), words.slice(-accent).join(" ")];
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function Avatar({ post, size }: { post: BlogPost; size: number }) {
  const author = post.author;
  if (!author) return null;
  return (
    <span className="gs-avatar" style={{ width: size, height: size }}>
      {author.avatar ? <img src={author.avatar} alt="" /> : initials(author.name)}
    </span>
  );
}

function ShareButtons({ url, title, onCopy }: { url: string; title: string; onCopy: () => void }) {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  const links = [
    {
      label: "Share on WhatsApp",
      href: `https://wa.me/?text=${t}%20${u}`,
      icon: <MessageSquare aria-hidden size={18} />,
    },
    {
      label: "Share on X",
      href: `https://twitter.com/intent/tweet?url=${u}&text=${t}`,
      icon: <X aria-hidden size={16} />,
    },
    {
      label: "Share on Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
      icon: <Facebook aria-hidden size={18} />,
    },
  ];
  return (
    <div className="gs-share-row">
      <button type="button" className="gs-share" onClick={onCopy} aria-label="Copy link">
        <Link2 aria-hidden size={18} />
      </button>
      {links.map((l) => (
        <a
          key={l.label}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          className="gs-share"
          aria-label={l.label}
        >
          {l.icon}
        </a>
      ))}
    </div>
  );
}

function BlogPostPage() {
  const post = Route.useLoaderData();
  const { html, outline } = useMemo(() => articleOutline(post.content ?? ""), [post.content]);
  const [lead, accent] = splitTitle(post.title);

  const articleRef = useRef<HTMLElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [minutesLeft, setMinutesLeft] = useState(post.read_minutes);
  const [shareUrl, setShareUrl] = useState("");
  const [toast, setToast] = useState<{ id: number; copied: boolean } | null>(null);
  const [vote, setVote] = useState<"yes" | "no" | null>(null);

  useEffect(() => {
    setShareUrl(`${window.location.origin}/blog/${post.slug}`);
    setActive(0);
    setVote(null);
  }, [post.slug]);

  useEffect(() => {
    let frame = 0;
    const track = () => {
      frame = 0;
      const article = articleRef.current;
      if (!article) return;
      const vh = window.innerHeight;
      const rect = article.getBoundingClientRect();
      const total = rect.height - vh * 0.6;
      const progress = total > 0 ? Math.min(1, Math.max(0, (vh * 0.2 - rect.top) / total)) : 0;
      if (barRef.current) barRef.current.style.transform = `scaleX(${progress})`;

      let current = 0;
      outline.forEach(({ id }, i) => {
        const heading = document.getElementById(id);
        if (heading && heading.getBoundingClientRect().top < vh * 0.35) current = i;
      });
      setActive(current);
      setMinutesLeft(Math.max(0, Math.round(post.read_minutes * (1 - progress))));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(track);
    };
    track();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [outline, post.read_minutes]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), TOAST_MS);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl).then(
      () => setToast({ id: Date.now(), copied: true }),
      () => setToast({ id: Date.now(), copied: false }),
    );
  };

  const share = <ShareButtons url={shareUrl} title={post.title} onCopy={copyLink} />;
  const related = post.related ?? [];

  return (
    <MarketingShell>
      <div className="gs-progress" aria-hidden="true">
        <div ref={barRef} />
      </div>

      <header className="gs-wrap gs-hero gs-post-head">
        <nav aria-label="Breadcrumb" className="gs-crumbs">
          <Link to="/blog" className="gs-crumb-back">
            <ArrowLeft aria-hidden size={18} />
            All articles
          </Link>
          {post.category && (
            <>
              <span aria-hidden="true">/</span>
              <Link to="/blog" className="gs-tag">
                {post.category}
              </Link>
            </>
          )}
        </nav>
        <h1 className="gs-h gs-post-title">
          {lead && `${lead} `}
          <span className="gs-underline">
            {accent}
            <svg viewBox="0 0 320 24" preserveAspectRatio="none" aria-hidden="true">
              <path d="M4 15 C 60 5, 130 3, 200 9 S 290 18, 316 7" />
            </svg>
          </span>
        </h1>
        {post.excerpt && <p className="gs-post-excerpt">{post.excerpt}</p>}
        <div className="gs-byline-row">
          <div className="gs-byline">
            <Avatar post={post} size={48} />
            <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {post.author && <span style={{ fontWeight: 600 }}>{post.author.name}</span>}
              <span style={{ fontSize: 14, color: "var(--muted)" }}>{postMeta(post)}</span>
            </span>
          </div>
          <div className="gs-mshare">{share}</div>
        </div>
      </header>

      <div className="gs-wrap" style={{ paddingBottom: 56 }}>
        <div className="gs-cover gs-reveal">
          {post.cover_url && <img src={post.cover_url} alt="" />}
        </div>
      </div>

      <div className="gs-wrap gs-post-layout" style={{ paddingBottom: 96 }}>
        <aside className="gs-post-side">
          {outline.length > 0 && (
            <div className="gs-side-block">
              <span className="gs-mono gs-side-label">In this guide</span>
              <nav className="gs-toc" aria-label="Table of contents">
                {outline.map((entry, i) => (
                  <a key={entry.id} href={`#${entry.id}`} aria-current={active === i}>
                    {entry.label}
                  </a>
                ))}
              </nav>
            </div>
          )}
          <div className="gs-side-block">
            <span className="gs-mono gs-side-label">Share</span>
            {share}
          </div>
          <span className="gs-mono" style={{ fontSize: 13, color: "var(--muted)" }}>
            {minutesLeft > 0 ? `${minutesLeft} min left` : "You made it to the end"}
          </span>
        </aside>

        <article ref={articleRef}>
          <div className="gs-prose" dangerouslySetInnerHTML={{ __html: html }} />

          <div className="gs-feedback">
            {vote ? (
              <span role="status" className="gs-feedback-done">
                <Check aria-hidden size={18} strokeWidth={2.4} />
                {vote === "yes"
                  ? "Asante! Glad it helped."
                  : "Thanks. We'll use your feedback to improve it."}
              </span>
            ) : (
              <>
                <span style={{ fontWeight: 600, fontSize: 18 }}>Was this guide helpful?</span>
                {/* Votes aren't stored yet; there is no feedback endpoint. */}
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    type="button"
                    className="gs-btn gs-ghost gs-vote"
                    onClick={() => setVote("yes")}
                  >
                    <ThumbsUp aria-hidden size={18} /> Yes
                  </button>
                  <button
                    type="button"
                    className="gs-btn gs-ghost gs-vote"
                    onClick={() => setVote("no")}
                  >
                    <ThumbsDown aria-hidden size={18} /> Not really
                  </button>
                </div>
              </>
            )}
          </div>

          {post.author && (
            <div className="gs-author-card">
              <Avatar post={post} size={64} />
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: 13, color: "var(--muted)" }}>Written by</span>
                <span className="gs-h" style={{ fontSize: 22, letterSpacing: "-0.01em" }}>
                  {post.author.name}
                </span>
                {post.author.bio && (
                  <span style={{ fontSize: 16, lineHeight: 1.6, color: "var(--muted)" }}>
                    {post.author.bio}
                  </span>
                )}
              </div>
            </div>
          )}
        </article>
      </div>

      <section aria-labelledby={related.length > 0 ? "keep-reading" : undefined} className="gs-alt">
        <div
          className="gs-wrap"
          style={{
            paddingTop: 88,
            paddingBottom: 96,
            display: "flex",
            flexDirection: "column",
            gap: 32,
          }}
        >
          {related.length > 0 && (
            <>
              <div className="gs-filter-row" style={{ alignItems: "flex-end" }}>
                <h2
                  id="keep-reading"
                  className="gs-h gs-reveal"
                  style={{ fontSize: "clamp(30px, 3.6vw, 46px)" }}
                >
                  Keep reading
                </h2>
                <Link to="/blog" style={{ fontWeight: 600, padding: "12px 0" }}>
                  All articles ›
                </Link>
              </div>
              <div className="gs-related">
                {related.map((r) => (
                  <Link
                    key={r.slug}
                    to="/blog/$slug"
                    params={{ slug: r.slug }}
                    className="gs-post gs-lift gs-reveal"
                  >
                    <div className="gs-thumb gs-thumb-sm">
                      {r.cover_url && <img src={r.cover_url} alt="" loading="lazy" />}
                    </div>
                    <div className="gs-post-body" style={{ padding: "22px 24px 24px" }}>
                      {r.category && <span className="gs-tag">{r.category}</span>}
                      <h3
                        className="gs-h"
                        style={{ fontSize: 21, lineHeight: 1.15, letterSpacing: "-0.02em" }}
                      >
                        {r.title}
                      </h3>
                      <span className="gs-post-meta">{postMeta(r)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
          <div className="gs-cta-band gs-reveal">
            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: 520 }}>
              <span className="gs-h" style={{ fontSize: 30 }}>
                Ready to look for land?
              </span>
              <span style={{ opacity: 0.85 }}>
                Explore plotted parcels and verified listings on the map.
              </span>
            </div>
            <Link to="/explore" className="gs-btn">
              Explore the map
              <ArrowRight aria-hidden size={18} className="gs-arrow" />
            </Link>
          </div>
        </div>
      </section>

      {toast && (
        <div key={toast.id} role="status" className="gs-toast">
          {toast.copied ? (
            <>
              <Check aria-hidden size={18} strokeWidth={2.4} /> Link copied
            </>
          ) : (
            "Couldn't copy the link"
          )}
        </div>
      )}
    </MarketingShell>
  );
}
