import { Check } from "lucide-react";
import type { Plan } from "@/lib/plans";

interface Props {
  plan: Plan;
  current?: boolean;
  onSelect?: () => void;
  yearly?: boolean;
}

function listingsLine(plan: Plan) {
  if (plan.listings === Infinity) return "Unlimited listings";
  return `Up to ${plan.listings} active ${plan.listings === 1 ? "listing" : "listings"}`;
}

export function PlanCard({ plan, current, onSelect, yearly }: Props) {
  const highlighted = Boolean(plan.badge) && !current;
  const displayPrice = yearly && plan.priceYearly !== null ? plan.priceYearly : plan.price;
  const period = yearly && plan.priceYearly !== null ? "/ yr" : "/ mo";
  return (
    <article className="gd-plan" data-pop={highlighted} data-cur={Boolean(current)}>
      {highlighted && plan.badge && <span className="gd-ribbon">{plan.badge.label}</span>}
      <h3 className="gd-eyebrow">{plan.name}</h3>
      <span className="flex items-baseline gap-1">
        <span className="gd-h text-[28px]">
          {displayPrice === 0 ? "Free" : `KES ${displayPrice.toLocaleString("en-US")}`}
        </span>
        {displayPrice > 0 && <span className="text-sm text-muted-foreground">{period}</span>}
      </span>
      <span className="text-sm font-semibold">{listingsLine(plan)}</span>
      <ul className="flex flex-1 flex-col gap-[7px]">
        {plan.features.map((f) => (
          <li key={f} className="gd-feat">
            <Check size={15} strokeWidth={2.6} aria-hidden="true" />
            {f}
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onSelect}
        disabled={current}
        className={`gd-btn ${highlighted ? "" : "gd-o"}`}
      >
        {current ? "Current plan" : displayPrice === 0 ? "Start free" : plan.cta}
      </button>
    </article>
  );
}
