import { AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/site/PageHeader";
import { useLegalDoc, type LegalDocType } from "@/lib/content";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function LegalDocPage({ type }: { type: LegalDocType }) {
  const { data: doc, isLoading, error } = useLegalDoc(type);
  const notFound = (error as { status?: number } | null)?.status === 404;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageHeader eyebrow="Legal" title={doc?.name ?? "Legal document"}>
        {doc && (
          <p className="text-sm text-muted-foreground">
            Version {doc.version}
            {doc.effective_date && ` · Effective ${formatDate(doc.effective_date)}`}
          </p>
        )}
      </PageHeader>

      <main className="mx-auto max-w-[760px] px-4 py-12 md:px-8 md:py-16">
        {isLoading && (
          <div className="flex flex-col gap-3">
            {[95, 88, 80, 92, 75, 85].map((w) => (
              <Skeleton key={w} className="h-4" style={{ width: `${w}%` }} />
            ))}
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
              <AlertCircle aria-hidden className="h-6 w-6 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-bold">
              {notFound ? "Not yet available" : "Couldn't load this document"}
            </h2>
            <p className="text-muted-foreground">
              {notFound
                ? "This document hasn't been published yet. Check back soon."
                : "Please check your connection and try again."}
            </p>
          </div>
        )}

        {doc && (
          <article className="rounded-xl border border-border bg-card p-6 text-card-foreground md:p-10">
            <div
              className="legal-body text-foreground"
              dangerouslySetInnerHTML={{ __html: doc.content }}
            />
            <p className="mt-10 border-t border-border pt-5 text-xs text-muted-foreground">
              Last published: {formatDate(doc.published_at)}
            </p>
          </article>
        )}
      </main>

      {/* Prose styles for admin-authored HTML content */}
      <style>{`
        .legal-body { line-height: 1.75; font-size: 1rem; }
        .legal-body > :first-child { margin-top: 0; }
        .legal-body h1, .legal-body h2, .legal-body h3, .legal-body h4 {
          font-weight: 600; margin-top: 2rem; margin-bottom: 0.75rem;
          color: var(--foreground);
        }
        .legal-body h1 { font-size: 1.5rem; }
        .legal-body h2 { font-size: 1.25rem; border-bottom: 1px solid var(--border); padding-bottom: 0.4rem; }
        .legal-body h3 { font-size: 1.05rem; }
        .legal-body p  { margin-bottom: 1rem; color: var(--muted-foreground); }
        .legal-body ul, .legal-body ol { padding-left: 1.5rem; margin-bottom: 1rem; color: var(--muted-foreground); }
        .legal-body li { margin-bottom: 0.35rem; }
        .legal-body ul { list-style-type: disc; }
        .legal-body ol { list-style-type: decimal; }
        .legal-body a  { color: var(--brand); text-decoration: underline; text-underline-offset: 2px; }
        .legal-body a:hover { color: var(--brand-hover); }
        .legal-body strong { font-weight: 600; color: var(--foreground); }
        .legal-body blockquote {
          border-left: 3px solid var(--border); padding-left: 1rem;
          margin: 1.25rem 0; color: var(--muted-foreground); font-style: italic;
        }
        .legal-body table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; font-size: 0.875rem; }
        .legal-body th, .legal-body td { border: 1px solid var(--border); padding: 0.5rem 0.75rem; text-align: left; }
        .legal-body th { background: var(--muted); font-weight: 600; }
        .legal-body hr { border: none; border-top: 1px solid var(--border); margin: 2rem 0; }
      `}</style>
    </div>
  );
}
