import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api, type Faq } from "@/lib/api";
import {
  ChevronDown,
  Search,
  MessageCircle,
  BookOpen,
  ShieldCheck,
  CreditCard,
} from "lucide-react";

export const Route = createFileRoute("/help")({
  head: () => ({ meta: [{ title: "Help Centre — Geo Properties Kenya" }] }),
  component: HelpPage,
});

const topicIcons: Record<string, React.ElementType> = {
  Verification: ShieldCheck,
  Account: MessageCircle,
  Billing: CreditCard,
  General: BookOpen,
};

function HelpPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<number | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    api
      .get<Faq[]>("/faqs")
      .then(setFaqs)
      .finally(() => setLoading(false));
  }, []);

  const filtered = faqs.filter(
    (f) =>
      !query ||
      f.question.toLowerCase().includes(query.toLowerCase()) ||
      f.answer.toLowerCase().includes(query.toLowerCase()),
  );

  const categories = Array.from(new Set(faqs.map((f) => f.category).filter(Boolean)));

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="border-b border-border bg-muted/30 py-16">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Help Centre</h1>
          <p className="mt-3 text-base text-muted-foreground">
            Search our knowledge base or browse by topic below.
          </p>
          <div className="relative mx-auto mt-6 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search questions…"
              className="h-11 w-full rounded-md border border-border bg-background pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
            />
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-3xl px-4 py-12">
        {/* Topic chips */}
        {!query && categories.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2">
            {categories.map((cat) => {
              const Icon = topicIcons[cat ?? ""] ?? BookOpen;
              return (
                <button
                  key={cat}
                  onClick={() => setQuery(cat ?? "")}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                >
                  <Icon className="h-3.5 w-3.5 text-primary" />
                  {cat}
                </button>
              );
            })}
          </div>
        )}

        {/* Heading */}
        <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {query ? `Results for "${query}"` : "Frequently asked questions"}
        </h2>

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        )}

        {/* FAQs */}
        {!loading && (
          <div className="divide-y divide-border rounded-xl border border-border bg-card">
            {filtered.length === 0 && (
              <div className="px-6 py-10 text-center text-sm text-muted-foreground">
                No results found. Try different keywords or{" "}
                <Link to="/contact" className="text-primary hover:underline">
                  contact support
                </Link>
                .
              </div>
            )}
            {filtered.map((faq, i) => (
              <div key={faq.id}>
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="text-sm font-medium text-foreground">{faq.question}</span>
                  <ChevronDown
                    className={`mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open === i ? "rotate-180" : ""}`}
                  />
                </button>
                {open === i && (
                  <div
                    className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground"
                    dangerouslySetInnerHTML={{ __html: faq.answer }}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Still need help? */}
        <div className="mt-12 rounded-xl border border-border bg-muted/40 p-6 text-center">
          <MessageCircle className="mx-auto mb-3 h-8 w-8 text-primary" />
          <h3 className="font-semibold text-foreground">Still need help?</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Our support team replies within one business day.
          </p>
          <Link
            to="/contact"
            className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-secondary"
          >
            Contact support
          </Link>
        </div>
      </main>
    </div>
  );
}
