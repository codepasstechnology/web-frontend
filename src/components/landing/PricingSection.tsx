import { Link, useNavigate } from "@tanstack/react-router";
import { PlanCard } from "@/components/PlanCard";
import type { Plan } from "@/lib/plans";

export function PricingSection({ plans }: { plans: Plan[] }) {
  const navigate = useNavigate();
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
        {plans.slice(0, 3).map((plan) => (
          <PlanCard
            key={plan.id}
            plan={{ ...plan, features: plan.features.slice(0, 4) }}
            onSelect={() => navigate({ to: "/pricing" })}
          />
        ))}
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
