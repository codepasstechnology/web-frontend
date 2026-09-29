import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Star, Zap } from "lucide-react";
import { PlanCard } from "@/components/PlanCard";
import { CtaBand } from "@/components/site/CtaBand";
import { PageHeader } from "@/components/site/PageHeader";
import { useAuth } from "@/lib/auth";
import { addOns, usePlans } from "@/lib/plans";

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
  }),
  component: PricingPage,
});

function PricingPage() {
  const { user, setPlan } = useAuth();
  const { data: plans = [] } = usePlans();
  const navigate = useNavigate();

  const choose = (id: string) => {
    if (!user) {
      navigate({ to: "/register" });
      return;
    }
    setPlan(id);
    navigate({ to: "/dashboard", search: { tab: undefined } });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageHeader eyebrow="Pricing" title="Plans that scale with your land business">
        <p className="max-w-[56ch] text-pretty text-[1.0625rem] leading-relaxed text-muted-foreground">
          Browsing is always free. Start free, and upgrade when you need more listings, photos and
          visibility. Pay monthly by M-Pesa or card.
        </p>
      </PageHeader>

      <section className="mx-auto max-w-[1100px] px-4 pt-14 md:px-8 md:pt-20">
        <div className="grid items-stretch gap-6 lg:grid-cols-3">
          {plans.map((p) => (
            <PlanCard
              key={p.id}
              plan={p}
              current={user?.plan === p.id}
              onSelect={() => choose(p.id)}
            />
          ))}
        </div>
      </section>

      <section
        aria-labelledby="addons-title"
        className="mx-auto flex max-w-[1100px] flex-col gap-6 px-4 pt-16 md:px-8 md:pt-24"
      >
        <div className="flex flex-col gap-2">
          <h2
            id="addons-title"
            className="text-[clamp(1.5rem,3vw,2rem)] font-bold leading-[1.15] tracking-[-0.02em]"
          >
            Boost individual listings
          </h2>
          <p className="text-muted-foreground">
            One-time add-ons on any plan, applied from your listings dashboard.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {addOns.map((a) => (
            <article
              key={a.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-5 text-card-foreground"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                  {a.id === "boost" ? (
                    <Zap aria-hidden className="h-5 w-5" />
                  ) : (
                    <Star aria-hidden className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <p className="font-semibold">{a.name}</p>
                  <p className="text-sm text-muted-foreground">{a.period}</p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="font-bold tabular-nums">KES {a.price.toLocaleString("en-US")}</div>
                <Link
                  to="/dashboard"
                  search={{ tab: "listings" }}
                  className="whitespace-nowrap text-sm font-semibold text-brand hover:underline"
                >
                  Add to a listing
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <CtaBand />
    </div>
  );
}
