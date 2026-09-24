import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Plan } from "@/lib/plans";

function listingsLine(plan: Plan) {
  if (plan.listings === Infinity) return "Unlimited listings";
  return `Up to ${plan.listings} active ${plan.listings === 1 ? "listing" : "listings"}`;
}

export function PricingSection({ plans }: { plans: Plan[] }) {
  if (plans.length === 0) return null;

  return (
    <section
      aria-labelledby="pricing-title"
      className="mx-auto mt-20 flex max-w-[1100px] flex-col gap-10 px-4 md:mt-[120px] md:px-8"
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <h2
          id="pricing-title"
          className="text-balance text-[clamp(1.75rem,3.6vw,2.5rem)] font-bold leading-[1.1] tracking-[-0.02em]"
        >
          Simple plans for sellers and agents
        </h2>
        <p className="max-w-[56ch] text-pretty text-[1.0625rem] leading-relaxed text-muted-foreground">
          Browsing is always free. Pay only when you list.
        </p>
      </div>

      <div className="grid items-stretch gap-6 lg:grid-cols-3">
        {plans.slice(0, 3).map((plan) => {
          const highlighted = Boolean(plan.badge);
          return (
            <article
              key={plan.id}
              className={`relative flex flex-col gap-5 rounded-xl bg-card px-7 py-8 text-card-foreground ${
                highlighted
                  ? "border-2 border-brand shadow-[0_10px_30px_-12px_rgb(15_23_42/0.18)]"
                  : "border border-border"
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-7 rounded-full bg-brand px-2.5 py-0.5 text-xs font-bold text-brand-foreground">
                  {plan.badge.label}
                </span>
              )}
              <div className="flex flex-col gap-1.5">
                <h3 className="text-lg font-bold">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{listingsLine(plan)}</p>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-semibold text-muted-foreground">KES</span>
                <span className="text-4xl font-extrabold tracking-[-0.02em] tabular-nums">
                  {plan.price.toLocaleString("en-US")}
                </span>
                <span className="text-sm text-muted-foreground">/mo</span>
              </div>
              <ul className="flex flex-col gap-2.5 text-[0.9375rem] leading-snug">
                {plan.features.slice(0, 4).map((f) => (
                  <li key={f} className="flex gap-2.5">
                    <Check
                      aria-hidden
                      className="mt-0.5 h-4 w-4 shrink-0 text-brand"
                      strokeWidth={2.5}
                    />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto flex flex-col pt-2">
                <Button
                  asChild
                  size="lg"
                  variant={highlighted ? "default" : "outline"}
                  className={`h-11 px-6 text-base ${
                    highlighted ? "bg-brand text-brand-foreground hover:bg-brand/90" : ""
                  }`}
                >
                  <Link to="/pricing">{plan.price === 0 ? "Start free" : plan.cta}</Link>
                </Button>
              </div>
            </article>
          );
        })}
      </div>

      <div className="flex flex-col items-center justify-center gap-x-6 gap-y-3 text-center text-[0.9375rem] text-muted-foreground md:flex-row">
        <span>Pay monthly by M-Pesa or card. Cancel anytime.</span>
        <Link to="/pricing" className="font-semibold text-brand hover:underline">
          Compare all plans →
        </Link>
      </div>
    </section>
  );
}
