import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { GuideCard } from "@/components/site/GuideCard";
import { PageHeader } from "@/components/site/PageHeader";
import { useBlogPosts } from "@/lib/content";

export const Route = createFileRoute("/blog")({
  head: () => ({ meta: [{ title: "Blog — Geo Pin Properties Kenya" }] }),
  component: BlogPage,
});

const ALL = "All";

function BlogPage() {
  const { data: posts = [], isLoading } = useBlogPosts();
  const [category, setCategory] = useState(ALL);

  const categories = [ALL, ...Array.from(new Set(posts.map((p) => p.category).filter(Boolean)))];
  const filtered = category === ALL ? posts : posts.filter((p) => p.category === category);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageHeader eyebrow="Guides" title="Land buying, demystified">
        <p className="max-w-[60ch] text-pretty text-[1.0625rem] leading-relaxed text-muted-foreground">
          Guides, industry news, and practical tips to help Kenyans buy, sell, and verify land with
          confidence.
        </p>
      </PageHeader>

      <main className="mx-auto flex max-w-[1100px] flex-col gap-8 px-4 py-12 md:px-8 md:py-16">
        {categories.length > 1 && (
          <ToggleGroup
            type="single"
            value={category}
            onValueChange={(v) => v && setCategory(v)}
            variant="outline"
            aria-label="Filter by category"
            className="flex-wrap justify-start"
          >
            {categories.map((cat) => (
              <ToggleGroupItem key={cat} value={cat}>
                {cat}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        )}

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="aspect-[4/3] w-full rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">
            No articles published yet. Check back soon.
          </p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((post) => (
              <GuideCard key={post.slug} post={post} detailed />
            ))}
          </div>
        )}

        <section
          aria-labelledby="newsletter-title"
          className="mt-8 flex flex-col items-center gap-3 rounded-xl border border-border bg-muted/40 px-6 py-10 text-center"
        >
          <h2 id="newsletter-title" className="text-xl font-bold">
            Get new articles in your inbox
          </h2>
          <p className="text-muted-foreground">One email a week — no spam, unsubscribe any time.</p>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="mt-2 flex w-full max-w-sm flex-col gap-2 sm:flex-row"
          >
            <Input
              type="email"
              required
              aria-label="Email address"
              placeholder="you@example.com"
              className="h-10 bg-background"
            />
            <Button
              type="submit"
              className="h-10 bg-brand text-brand-foreground hover:bg-brand-hover"
            >
              Subscribe
            </Button>
          </form>
        </section>
      </main>
    </div>
  );
}
