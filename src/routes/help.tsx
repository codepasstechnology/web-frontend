import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { MessageCircle, Search } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PageHeader } from "@/components/site/PageHeader";
import { useFaqs } from "@/lib/content";

export const Route = createFileRoute("/help")({
  head: () => ({ meta: [{ title: "Help Centre — Geo Pin Properties Kenya" }] }),
  component: HelpPage,
});

const ALL = "All";

function HelpPage() {
  const { data: faqs = [], isLoading } = useFaqs();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(ALL);

  const categories = [ALL, ...Array.from(new Set(faqs.map((f) => f.category).filter(Boolean)))];
  const q = query.trim().toLowerCase();
  const filtered = faqs.filter(
    (f) =>
      (category === ALL || f.category === category) &&
      (!q || f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q)),
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageHeader eyebrow="Help centre" title="How can we help?">
        <p className="max-w-[56ch] text-[1.0625rem] leading-relaxed text-muted-foreground">
          Search our answers or browse by topic.
        </p>
        <div className="relative mt-3 w-full max-w-md">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search questions…"
            aria-label="Search questions"
            className="h-11 bg-background pl-9 text-base"
          />
        </div>
      </PageHeader>

      <main className="mx-auto flex max-w-[760px] flex-col gap-8 px-4 py-12 md:px-8 md:py-16">
        {categories.length > 1 && (
          <ToggleGroup
            type="single"
            value={category}
            onValueChange={(v) => v && setCategory(v)}
            variant="outline"
            aria-label="Filter by topic"
            className="flex-wrap justify-start"
          >
            {categories.map((cat) => (
              <ToggleGroupItem key={cat} value={cat}>
                {cat}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        )}

        <section aria-labelledby="faq-list-title" className="flex flex-col gap-4">
          <h2
            id="faq-list-title"
            className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground"
          >
            {q ? `Results for "${query.trim()}"` : "Frequently asked questions"}
          </h2>

          {isLoading ? (
            <div className="flex flex-col gap-3">
              {[0, 1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="rounded-xl border border-border bg-card px-6 py-10 text-center text-muted-foreground">
              No results found. Try different keywords or{" "}
              <Link to="/contact" className="font-semibold text-brand hover:underline">
                contact support
              </Link>
              .
            </p>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {filtered.map((faq) => (
                <AccordionItem key={faq.id} value={faq.id}>
                  <AccordionTrigger className="text-left text-base">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div
                      className="text-[0.9375rem] leading-relaxed text-muted-foreground"
                      dangerouslySetInnerHTML={{ __html: faq.answer }}
                    />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </section>

        <aside className="flex flex-col items-center gap-3 rounded-xl border border-border bg-muted/40 p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-card">
            <MessageCircle aria-hidden className="h-6 w-6 text-brand" strokeWidth={1.75} />
          </div>
          <h2 className="text-lg font-bold">Still need help?</h2>
          <p className="text-muted-foreground">Our support team replies within one business day.</p>
          <Button asChild className="mt-1 bg-brand text-brand-foreground hover:bg-brand-hover">
            <Link to="/contact">Contact support</Link>
          </Button>
        </aside>
      </main>
    </div>
  );
}
