import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Calendar } from "lucide-react";
import { api, type BlogPost } from "@/lib/api";

export const Route = createFileRoute("/blog_/$slug")({
  component: BlogPostPage,
});

function BlogPostPage() {
  const { slug } = Route.useParams();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    api
      .get<BlogPost>(`/blog/${slug}`)
      .then(setPost)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Link
          to="/blog"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to blog
        </Link>

        {loading && <p className="py-16 text-sm text-muted-foreground">Loading article…</p>}

        {!loading && notFound && (
          <p className="py-16 text-sm text-muted-foreground">
            That article could not be found. It may have been unpublished.
          </p>
        )}

        {!loading && post && (
          <article className="mt-8">
            {post.cover_url && (
              <img
                src={post.cover_url}
                alt=""
                className="mb-8 h-64 w-full rounded-xl object-cover"
              />
            )}

            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              {post.category}
            </span>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              {post.title}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-5 border-b border-border pb-6 text-sm text-muted-foreground">
              {post.author && <span>{post.author.name}</span>}
              {post.published_at && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(post.published_at).toLocaleDateString("en-KE", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              )}
              <span>{post.read_minutes} min read</span>
            </div>

            <div
              className="article-body mt-8 text-foreground"
              dangerouslySetInnerHTML={{ __html: post.content ?? "" }}
            />
          </article>
        )}
      </div>

      {/* Prose styles for admin-authored HTML content */}
      <style>{`
        .article-body { line-height: 1.75; font-size: 1rem; }
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
        .article-body a  { color: #2563eb; text-decoration: underline; text-underline-offset: 2px; }
        .article-body a:hover { color: #1d4ed8; }
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
