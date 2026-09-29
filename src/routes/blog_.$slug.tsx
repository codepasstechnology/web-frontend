import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useBlogPost } from "@/lib/content";

export const Route = createFileRoute("/blog_/$slug")({
  component: BlogPostPage,
});

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function BlogPostPage() {
  const { slug } = Route.useParams();
  const { data: post, isLoading, isError } = useBlogPost(slug);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-[760px] px-4 pb-16 pt-10 md:px-8 md:pt-14">
        <Button asChild variant="ghost" size="sm" className="-ml-3 text-muted-foreground">
          <Link to="/blog">
            <ArrowLeft /> Back to guides
          </Link>
        </Button>

        {isLoading && (
          <div className="mt-8 flex flex-col gap-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-10 w-4/5" />
            <Skeleton className="aspect-video w-full rounded-xl" />
          </div>
        )}

        {isError && (
          <p className="py-16 text-muted-foreground">
            That article could not be found. It may have been unpublished.
          </p>
        )}

        {post && (
          <article className="mt-8">
            <header className="flex flex-col gap-4 border-b border-border pb-8">
              <div className="flex">
                <Badge variant="secondary">{post.category}</Badge>
              </div>
              <h1 className="text-balance text-[clamp(2rem,4.5vw,3rem)] font-bold leading-[1.1] tracking-[-0.02em]">
                {post.title}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                {post.author && (
                  <span className="flex items-center gap-2 font-medium text-foreground">
                    <Avatar className="h-8 w-8">
                      {post.author.avatar && <AvatarImage src={post.author.avatar} alt="" />}
                      <AvatarFallback className="bg-brand/10 text-xs font-bold text-brand">
                        {initials(post.author.name)}
                      </AvatarFallback>
                    </Avatar>
                    {post.author.name}
                  </span>
                )}
                {post.published_at && (
                  <span>
                    {new Date(post.published_at).toLocaleDateString("en-KE", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                )}
                <span>{post.read_minutes} min read</span>
              </div>
            </header>

            {post.cover_url && (
              <img
                src={post.cover_url}
                alt=""
                className="mt-8 aspect-video w-full rounded-xl object-cover"
              />
            )}

            <div
              className="article-body mt-8 text-foreground"
              dangerouslySetInnerHTML={{ __html: post.content ?? "" }}
            />
          </article>
        )}
      </div>

      {/* Prose styles for admin-authored HTML content */}
      <style>{`
        .article-body { line-height: 1.75; font-size: 1.0625rem; }
        .article-body h1, .article-body h2, .article-body h3, .article-body h4 {
          font-weight: 600; margin-top: 2rem; margin-bottom: 0.75rem;
          color: var(--foreground);
        }
        .article-body h1 { font-size: 1.5rem; }
        .article-body h2 { font-size: 1.25rem; }
        .article-body h3 { font-size: 1.05rem; }
        .article-body p  { margin-bottom: 1rem; color: var(--muted-foreground); }
        .article-body ul, .article-body ol { padding-left: 1.5rem; margin-bottom: 1rem; color: var(--muted-foreground); }
        .article-body li { margin-bottom: 0.35rem; }
        .article-body ul { list-style-type: disc; }
        .article-body ol { list-style-type: decimal; }
        .article-body a  { color: var(--brand); text-decoration: underline; text-underline-offset: 2px; }
        .article-body a:hover { color: var(--brand-hover); }
        .article-body strong { font-weight: 600; color: var(--foreground); }
        .article-body img { max-width: 100%; border-radius: 0.5rem; margin: 1.5rem 0; }
        .article-body blockquote {
          border-left: 3px solid var(--border); padding-left: 1rem;
          margin: 1.25rem 0; color: var(--muted-foreground); font-style: italic;
        }
        .article-body hr { border: none; border-top: 1px solid var(--border); margin: 2rem 0; }
      `}</style>
    </div>
  );
}
