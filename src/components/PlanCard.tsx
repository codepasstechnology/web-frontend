import { Check } from "lucide-react";
import type { Plan } from "@/lib/plans";

interface Props {
  plan: Plan;
  current?: boolean;
  onSelect?: () => void;
}

export function PlanCard({ plan, current, onSelect }: Props) {
  const isPopular = plan.badge?.color === "accent";
  return (
    <div
      className={`relative flex flex-col rounded-lg border bg-card p-6 shadow-sm ${
        isPopular ? "border-brand" : "border-border"
      }`}
    >
      {plan.badge && (
        <span
          className={`absolute right-4 top-4 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white ${
            plan.badge.color === "accent" ? "bg-brand" : "bg-primary"
          }`}
        >
          {plan.badge.label}
        </span>
      )}
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {plan.name}
      </h3>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-3xl font-semibold text-foreground">
          {plan.price === 0 ? "Ksh 0" : `Ksh ${plan.price.toLocaleString()}`}
        </span>
        <span className="text-sm text-muted-foreground">/month</span>
      </div>
      <ul className="mt-6 space-y-2.5 text-sm text-foreground">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <button
        onClick={onSelect}
        disabled={current}
        className={`mt-7 inline-flex h-10 items-center justify-center rounded-md text-sm font-medium transition-colors ${
          current
            ? "cursor-not-allowed border border-border bg-background text-muted-foreground"
            : "bg-brand text-brand-foreground hover:bg-brand-hover"
        }`}
      >
        {current ? "Current Plan" : plan.cta}
      </button>
    </div>
  );
}
