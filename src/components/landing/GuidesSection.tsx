import { Link } from "@tanstack/react-router";
import { GuideCard } from "@/components/site/GuideCard";
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
          <GuideCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}
