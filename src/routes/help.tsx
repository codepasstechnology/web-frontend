import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  CircleUserRound,
  Home,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { FaqAccordion } from "@/components/site/FaqAccordion";
import { MARKETING_FONT_LINKS } from "@/components/site/marketingFonts";
import { MarketingShell } from "@/components/site/MarketingShell";
import { PageHero } from "@/components/site/PageHero";
import { useFaqs } from "@/lib/content";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [{ title: "Help Centre — Geo Pin Properties Kenya" }],
    links: MARKETING_FONT_LINKS,
  }),
  component: HelpPage,
});

interface Topic {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  aliases: string[];
}

const TOPICS: Topic[] = [
  {
    id: "getting-started",
    title: "Getting started",
    description: "Creating an account and finding your way around the map.",
    icon: MapPin,
    aliases: ["getting started"],
  },
  {
    id: "buying-land",
    title: "Buying land",
    description: "Searching, saving plots and contacting owners.",
    icon: Home,
    aliases: ["buying land", "buying"],
  },
  {
    id: "listing-property",
    title: "Listing property",
    description: "Pinning boundaries, photos and managing enquiries.",
    icon: Plus,
    aliases: ["listing property", "listing"],
  },
  {
    id: "verification",
    title: "Verification",
    description: "What the badge means and how to get verified.",
    icon: ShieldCheck,
    aliases: ["verification"],
  },
  {
    id: "account-billing",
    title: "Account and billing",
    description: "Plans, payments, password and settings.",
    icon: CircleUserRound,
    aliases: ["account & billing", "account and billing", "account", "billing"],
  },
  {
    id: "safety-scams",
    title: "Safety and scams",
    description: "Spotting red flags and reporting a listing.",
    icon: TriangleAlert,
    aliases: ["safety & scams", "safety and scams", "safety", "scams"],
  },
];

function topicFor(category: string) {
  const c = category.trim().toLowerCase();
  return TOPICS.find((t) => t.aliases.includes(c));
}

function plainText(html: string) {
  return html.replace(/<[^>]*>/g, " ");
}

function HelpPage() {
  const { data: faqs = [], isLoading } = useFaqs();
  const [query, setQuery] = useState("");
  const [topicId, setTopicId] = useState<string | null>(null);

  const q = query.trim().toLowerCase();
  const activeTopic = TOPICS.find((t) => t.id === topicId) ?? null;
  const filtered = Boolean(q || activeTopic);

  const shown = faqs.filter(
    (f) =>
      (!activeTopic || topicFor(f.category)?.id === activeTopic.id) &&
      (!q || `${f.question} ${plainText(f.answer)}`.toLowerCase().includes(q)),
  );

  const reset = () => {
    setQuery("");
    setTopicId(null);
  };

  const listTitle = q ? "Search results" : activeTopic ? activeTopic.title : "Popular questions";
  const answerWord = (n: number) => (n === 1 ? "answer" : "answers");
  const listSub = q
    ? `${shown.length} ${answerWord(shown.length)} for "${query.trim()}"`
    : activeTopic
      ? `${shown.length} ${answerWord(shown.length)} in this topic`
      : "Quick answers to what people ask most.";

  return (
    <MarketingShell>
      <PageHero
        eyebrow="Help centre"
        title="How can we"
        highlight="help?"
        lede="Search for answers, or browse by topic below."
      >
        <div className="gs-search">
          <label htmlFor="help-q" className="gs-sr-only">
            Search help articles
          </label>
          <Search aria-hidden size={20} />
          <input
            id="help-q"
            className="gs-input"
            type="search"
            placeholder="Try 'verification' or 'list a property'"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setTopicId(null);
            }}
          />
        </div>
      </PageHero>

      {!filtered && (
        <section aria-label="Browse by topic" className="gs-wrap" style={{ paddingBottom: 80 }}>
          <div className="gs-grid" style={{ gap: 18 }}>
            {TOPICS.map((topic) => {
              const Icon = topic.icon;
              const count = faqs.filter((f) => topicFor(f.category)?.id === topic.id).length;
              return (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => setTopicId(topic.id)}
                  className="gs-topic gs-lift gs-reveal"
                >
                  <span className="gs-blob">
                    <Icon aria-hidden size={24} strokeWidth={1.8} />
                  </span>
                  <span className="gs-h" style={{ fontSize: 21, letterSpacing: "-0.01em" }}>
                    {topic.title}
                  </span>
                  <span style={{ fontSize: 15, lineHeight: 1.5, color: "var(--muted)" }}>
                    {topic.description}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--accent)" }}>
                    {count} {count === 1 ? "article" : "articles"}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section
        aria-labelledby="faq-list-title"
        className="gs-wrap gs-split"
        style={{ paddingBottom: 96 }}
      >
        <div className="gs-stack">
          <h2
            id="faq-list-title"
            className="gs-h"
            style={{ fontSize: "clamp(30px, 3.6vw, 46px)", lineHeight: 1 }}
          >
            {listTitle}
          </h2>
          <p role="status" className="gs-text" style={{ fontSize: 16 }}>
            {listSub}
          </p>
          {filtered && (
            <button
              type="button"
              className="gs-btn gs-ghost"
              onClick={reset}
              style={{ alignSelf: "flex-start", minHeight: 44 }}
            >
              Show all topics
            </button>
          )}
        </div>
        <div>
          {isLoading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : shown.length === 0 ? (
            <div
              className="gs-faq-a"
              style={{ padding: "32px 4px", display: "flex", flexDirection: "column", gap: 10 }}
            >
              <span className="gs-hand" style={{ fontSize: 28 }}>
                hmm, nothing matched that.
              </span>
              <span>
                Try a different word, or <Link to="/contact">ask our team</Link>.
              </span>
            </div>
          ) : (
            <FaqAccordion key={`${q}|${topicId}`} faqs={shown} />
          )}
        </div>
      </section>

      <section className="gs-wrap" style={{ paddingBottom: 112 }}>
        <div className="gs-card gs-help-cta gs-reveal">
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 560 }}>
            <h2 className="gs-h" style={{ fontSize: 32 }}>
              Still need help?
            </h2>
            <p style={{ margin: 0, fontSize: 17, opacity: 0.85 }}>
              Our team usually replies within [RESPONSE TIME] on working days.
            </p>
          </div>
          <Link to="/contact" className="gs-btn">
            Contact us
            <ArrowRight aria-hidden size={18} className="gs-arrow" />
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}
