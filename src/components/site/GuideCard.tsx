import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import type { BlogPost } from "@/lib/api";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-KE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function GuideCard({ post, detailed = false }: { post: BlogPost; detailed?: boolean }) {
  return (
    <Link
      to="/blog/$slug"
      params={{ slug: post.slug }}
      className="flex flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground transition-colors hover:border-brand"
    >
      <div className="aspect-video bg-muted">
        {post.cover_url && (
          <img src={post.cover_url} alt="" loading="lazy" className="h-full w-full object-cover" />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2.5 px-5 pb-5 pt-[18px]">
        <div className="flex">
          <Badge variant="secondary">{post.category}</Badge>
        </div>
        <h3 className="text-pretty text-[1.0625rem] font-semibold leading-snug">{post.title}</h3>
        {detailed && post.excerpt && (
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {post.excerpt}
          </p>
        )}
        <span className="mt-auto text-[0.8125rem] text-muted-foreground">
          {detailed && post.published_at && `${formatDate(post.published_at)} · `}
          {post.read_minutes} min read
        </span>
      </div>
    </Link>
  );
}
