import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { api } from "@/lib/api";
import { FileText, AlertCircle, Calendar, Tag } from "lucide-react";

interface LegalDoc {
  name: string;
  version: string;
  content: string;
  effective_date: string | null;
  published_at: string;
}

interface Props {
  type: "terms" | "privacy";
}

export function LegalDocPage({ type }: Props) {
  const [doc, setDoc]         = useState<LegalDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    api.get<LegalDoc>(`/legal/${type}`)
      .then(setDoc)
      .catch((e: unknown) => {
        if ((e as { status?: number }).status === 404) setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [type]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="mx-auto max-w-3xl px-4 py-10 md:py-16">

        {/* Loading skeleton */}
        {loading && (
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-2/3 rounded-md bg-muted" />
            <div className="h-4 w-1/3 rounded-md bg-muted" />
            <div className="mt-8 space-y-3">
              {[95, 88, 80, 92, 75, 85].map((w, i) => (
                <div key={i} className="h-4 rounded-md bg-muted" style={{ width: `${w}%` }} />
              ))}
            </div>
          </div>
        )}

        {/* Not published yet */}
        {!loading && notFound && (
          <div className="flex flex-col items-center py-24 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-muted">
              <AlertCircle className="h-6 w-6 text-muted-foreground" />
            </div>
            <h1 className="mt-4 text-xl font-semibold text-foreground">Not yet available</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              This document hasn't been published yet. Check back soon.
            </p>
          </div>
        )}

        {/* Document */}
        {!loading && doc && (
          <>
            {/* Header */}
            <div className="border-b border-border pb-6">
              <p className="mb-3 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <FileText className="h-3.5 w-3.5" />
                Legal Document
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">{doc.name}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-5 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5" />
                  Version {doc.version}
                </span>
                {doc.effective_date && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Effective{" "}
                    {new Date(doc.effective_date).toLocaleDateString("en-KE", {
                      day: "numeric", month: "long", year: "numeric",
                    })}
                  </span>
                )}
              </div>
            </div>

            {/* Body */}
            <div
              className="legal-body mt-8 text-foreground"
              dangerouslySetInnerHTML={{ __html: doc.content }}
            />

            {/* Footer */}
            <p className="mt-12 border-t border-border pt-5 text-xs text-muted-foreground">
              Last published:{" "}
              {new Date(doc.published_at).toLocaleDateString("en-KE", {
                day: "numeric", month: "long", year: "numeric",
              })}
            </p>
          </>
        )}
      </div>

      {/* Prose styles for admin-authored HTML content */}
      <style>{`
        .legal-body { line-height: 1.75; font-size: 0.9375rem; }
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
        .legal-body a  { color: #2563eb; text-decoration: underline; text-underline-offset: 2px; }
        .legal-body a:hover { color: #1d4ed8; }
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
