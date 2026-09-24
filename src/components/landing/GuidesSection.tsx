import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import type { BlogPost } from "@/lib/api";

export function GuidesSection({ posts }: { posts: BlogPost[] }) {
  if (posts.length === 0) return null;

  return (
    <section
      aria-labelledby="guides-title"
      className="mx-auto mt-20 flex max-w-[1100px] flex-col gap-10 px-4 md:mt-[120px] md:px-8"
    >
      <div className="flex items-baseline justify-between gap-4">
        <h2
          id="guides-title"
          className="text-[clamp(1.75rem,3.6vw,2.5rem)] font-bold leading-[1.1] tracking-[-0.02em]"
        >
          Guides
        </h2>
        <Link
          to="/blog"
          className="shrink-0 text-[0.9375rem] font-semibold text-brand hover:underline"
        >
          All guides →
        </Link>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.slice(0, 3).map((post) => (
          <Link
            key={post.id}
            to="/blog/$slug"
            params={{ slug: post.slug }}
            className="flex flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground transition-colors hover:border-brand"
          >
            <div className="aspect-video bg-muted">
              {post.cover_url && (
                <img
                  src={post.cover_url}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <div className="flex flex-col gap-2.5 px-5 pb-5 pt-[18px]">
              <div className="flex">
                <Badge variant="secondary">{post.category}</Badge>
              </div>
              <h3 className="text-pretty text-[1.0625rem] font-semibold leading-snug">
                {post.title}
              </h3>
              <span className="text-[0.8125rem] text-muted-foreground">
                {post.read_minutes} min read
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
