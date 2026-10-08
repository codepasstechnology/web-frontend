import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { FaqAccordion } from "@/components/site/FaqAccordion";
import { MARKETING_FONT_LINKS } from "@/components/site/marketingFonts";
import { MarketingShell } from "@/components/site/MarketingShell";
import { PageHero } from "@/components/site/PageHero";
import { useAuth } from "@/lib/auth";
import { useFaqs } from "@/lib/content";
import { usePlans, type Plan } from "@/lib/plans";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Geo Pin Properties Kenya" },
      {
        name: "description",
        content:
          "Simple, transparent pricing for land sellers, agents and developers across Kenya.",
      },
      { property: "og:title", content: "Pricing — Geo Pin Properties Kenya" },
      {
        property: "og:description",
        content: "Free, Basic and Pro plans for listing verified land in Kenya.",
      },
    ],
    links: MARKETING_FONT_LINKS,
  }),
  component: PricingPage,
});

const CARD_COUNT = 3;

const EVERY_PLAN = [
  "Browse the land map",
  "Plot boundaries and verification status",
  "Saved plots and alerts",
  "Message owners and agents",
];

// Limits ("10 active listings", "Unlimited active listings") get their own rows in the table.
const LIMIT_FEATURE = /^(\d|Unlimited)/;

type Cell = boolean | string;

function limit(n: number) {
  return n === Infinity ? "Unlimited" : String(n);
}

function billed(plan: Plan, yearly: boolean) {
  if (plan.price === 0) return { price: "Free", per: "forever" };
  const yearlyPrice = yearly ? plan.priceYearly : null;
  return {
    price: `KES ${(yearlyPrice ?? plan.price).toLocaleString("en-US")}`,
    per: yearlyPrice === null ? "/ month" : "/ year",
  };
}

function monthsFree(plans: Plan[]) {
  const months = plans.flatMap((p) =>
    p.price > 0 && p.priceYearly !== null ? [Math.round(12 - p.priceYearly / p.price)] : [],
  );
  return Math.max(0, ...months);
}

function comparisonRows(plans: Plan[]): { feature: string; cells: Cell[] }[] {
  const extras = [
    ...new Set(plans.flatMap((p) => p.features.filter((f) => !LIMIT_FEATURE.test(f)))),
  ];
  return [
    ...EVERY_PLAN.map((feature) => ({ feature, cells: plans.map(() => true) })),
    { feature: "Active listings", cells: plans.map((p) => limit(p.listings)) },
    { feature: "Photos per listing", cells: plans.map((p) => limit(p.photos)) },
    { feature: "Documents per listing", cells: plans.map((p) => limit(p.documents)) },
    ...extras.map((feature) => ({
      feature,
      cells: plans.map((p) => p.features.includes(feature)),
    })),
  ];
}

function ComparisonCell({ value }: { value: Cell }) {
  if (value === true) {
    return (
      <>
        <Check aria-hidden size={18} strokeWidth={2.4} />
        <span className="gs-sr-only">Included</span>
      </>
    );
  }
  if (value === false) {
    return (
      <>
        <span aria-hidden>—</span>
        <span className="gs-sr-only">Not included</span>
      </>
    );
  }
  return <>{value}</>;
}

function PricingPage() {
  const { user, setPlan } = useAuth();
  const { data: plans = [] } = usePlans();
  const { data: faqs = [] } = useFaqs();
  const navigate = useNavigate();
  const [yearly, setYearly] = useState(false);

  const choose = (id: string) => {
    if (!user) {
      navigate({ to: "/register" });
      return;
    }
    setPlan(id);
    navigate({ to: "/dashboard", search: { tab: undefined } });
  };

  const cardPlans = plans.slice(0, CARD_COUNT);
  const otherPlans = plans.slice(CARD_COUNT);
  const saving = monthsFree(plans);
  const pricingFaqs = faqs.filter((f) => f.category.toLowerCase().includes("pricing"));
  const faqsToShow = pricingFaqs.length > 0 ? pricingFaqs : faqs.slice(0, 5);

  return (
    <MarketingShell>
      <PageHero
        eyebrow="Pricing"
        title="Simple plans for"
        highlight="serious land."
        lede="Explore the map for free. Upgrade when you are ready to list, verify or manage properties."
      >
        <div role="group" aria-label="Billing period" className="gs-billing">
          <button type="button" aria-pressed={!yearly} onClick={() => setYearly(false)}>
            Monthly
          </button>
          <button type="button" aria-pressed={yearly} onClick={() => setYearly(true)}>
            Yearly
            {saving > 0 && (
              <span className="gs-save">
                {saving} {saving === 1 ? "month" : "months"} free
              </span>
            )}
          </button>
        </div>
      </PageHero>

      <section className="gs-wrap" style={{ paddingBottom: 96 }}>
        <div className="gs-plans">
          {cardPlans.map((plan) => {
            const featured = Boolean(plan.badge);
            const current = user?.plan === plan.id;
            const { price, per } = billed(plan, yearly);
            return (
              <article
                key={plan.id}
                className={`gs-plan gs-reveal${featured ? " gs-plan-featured" : ""}`}
              >
                {plan.badge && <span className="gs-plan-badge">{plan.badge.label}</span>}
                <h2 className="gs-h" style={{ fontSize: 26, letterSpacing: "-0.02em" }}>
                  {plan.name}
                </h2>
                <div className="gs-price-row">
                  <span
                    key={per}
                    className={`gs-h gs-price${plan.price === 0 ? " gs-price-free" : ""}`}
                  >
                    {price}
                  </span>
                  <span style={{ fontSize: 15, color: "var(--muted)" }}>{per}</span>
                </div>
                <button
                  type="button"
                  className={`gs-btn${featured && !current ? "" : " gs-ghost"}`}
                  style={{ width: "100%" }}
                  disabled={current}
                  onClick={() => choose(plan.id)}
                >
                  {current ? "Current plan" : plan.price === 0 ? "Start exploring" : plan.cta}
                </button>
                <div className="gs-rule" />
                <ul className="gs-feats">
                  {plan.features.map((f) => (
                    <li key={f}>
                      <Check aria-hidden size={18} strokeWidth={2.4} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
        {otherPlans.map((plan) => {
          const { price, per } = billed(plan, yearly);
          return (
            <div key={plan.id} className="gs-card gs-more-plan gs-reveal">
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <h2 className="gs-h" style={{ fontSize: 26, letterSpacing: "-0.02em" }}>
                  {plan.name}
                </h2>
                <p className="gs-text">
                  For larger agencies and teams. From {price} {per}.
                </p>
              </div>
              <Link to="/contact" className="gs-btn gs-ghost">
                Talk to us
                <ArrowRight aria-hidden size={18} className="gs-arrow" />
              </Link>
            </div>
          );
        })}
        <p
          className="gs-hand"
          style={{ textAlign: "center", fontSize: 26, margin: "36px 0 0", rotate: "-2deg" }}
        >
          no hidden fees, cancel anytime
        </p>
      </section>

      {plans.length > 0 && (
        <section aria-labelledby="compare-title" className="gs-alt">
          <div
            className="gs-wrap"
            style={{ paddingTop: 96, paddingBottom: 96, display: "grid", gap: 36 }}
          >
            <h2 id="compare-title" className="gs-h gs-h2 gs-reveal">
              Compare plans
            </h2>
            <div className="gs-table-wrap gs-reveal">
              <table className="gs-table">
                <thead>
                  <tr>
                    <th scope="col">Feature</th>
                    {plans.map((p) => (
                      <th key={p.id} scope="col">
                        {p.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows(plans).map((row) => (
                    <tr key={row.feature}>
                      <th scope="row">{row.feature}</th>
                      {row.cells.map((value, i) => (
                        <td key={plans[i].id}>
                          <ComparisonCell value={value} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {faqsToShow.length > 0 && (
        <section
          aria-labelledby="faq-title"
          className="gs-wrap gs-split"
          style={{ paddingTop: 96, paddingBottom: 40 }}
        >
          <div className="gs-stack gs-reveal">
            <h2 id="faq-title" className="gs-h gs-h2">
              Pricing questions
            </h2>
            <p className="gs-text">
              Can&apos;t find your answer? <Link to="/help">Visit the help centre</Link> or{" "}
              <Link to="/contact">talk to us</Link>.
            </p>
          </div>
          <div className="gs-reveal">
            <FaqAccordion faqs={faqsToShow} />
          </div>
        </section>
      )}

      <section className="gs-wrap" style={{ paddingTop: 40, paddingBottom: 112 }}>
        <div className="gs-deep gs-reveal">
          <h2 className="gs-h">Start exploring for free.</h2>
          <p>Create an account in a minute. Upgrade only when you need to.</p>
          <Link to="/register" className="gs-btn">
            Create a free account
            <ArrowRight aria-hidden size={18} className="gs-arrow" />
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}
