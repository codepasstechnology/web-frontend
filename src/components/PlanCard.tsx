import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Plan } from "@/lib/plans";

interface Props {
  plan: Plan;
  current?: boolean;
  onSelect?: () => void;
}

function listingsLine(plan: Plan) {
  if (plan.listings === Infinity) return "Unlimited listings";
  return `Up to ${plan.listings} active ${plan.listings === 1 ? "listing" : "listings"}`;
}

export function PlanCard({ plan, current, onSelect }: Props) {
  const highlighted = Boolean(plan.badge);
  return (
    <article
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
        {plan.features.map((f) => (
          <li key={f} className="flex gap-2.5">
            <Check aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-brand" strokeWidth={2.5} />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <div className="mt-auto flex flex-col pt-2">
        <Button
          size="lg"
          onClick={onSelect}
          disabled={current}
          variant={highlighted && !current ? "default" : "outline"}
          className={`h-11 px-6 text-base ${
            highlighted && !current ? "bg-brand text-brand-foreground hover:bg-brand-hover" : ""
          }`}
        >
          {current ? "Current plan" : plan.price === 0 ? "Start free" : plan.cta}
        </Button>
      </div>
    </article>
  );
}
