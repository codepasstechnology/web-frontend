import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PlanCard } from "@/components/PlanCard";
import { plans, addOns, type PlanId } from "@/lib/plans";
import { useAuth } from "@/lib/auth";
import { Zap, Star } from "lucide-react";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — LandVerify Kenya" },
      {
        name: "description",
        content:
          "Simple, transparent pricing for land sellers, agents and developers across Kenya.",
      },
      { property: "og:title", content: "Pricing — LandVerify Kenya" },
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
  const navigate = useNavigate();

  const choose = (id: PlanId) => {
    if (!user) {
      navigate({ to: "/register" });
      return;
    }
    setPlan(id);
    navigate({ to: "/dashboard", search: { tab: undefined } });
  };

  return (
    <div className="min-h-screen bg-background">
      <section className="mx-auto max-w-7xl px-4 py-12 md:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-card px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Pricing
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Plans that scale with your land business
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            Start free. Upgrade when you need more listings, photos and visibility.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {plans.map((p) => (
            <PlanCard
              key={p.id}
              plan={p}
              current={user?.plan === p.id}
              onSelect={() => choose(p.id)}
            />
          ))}
        </div>

        <div className="mt-16">
          <h2 className="text-lg font-semibold text-foreground">Boost Individual Listings</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            One-time add-ons available on any plan.
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {addOns.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-lg border border-border bg-card p-5 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted text-foreground">
                    {a.id === "boost" ? <Zap className="h-4 w-4" /> : <Star className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{a.name}</p>
                    <p className="text-xs text-muted-foreground">{a.period}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-semibold text-foreground">Ksh {a.price}</div>
                  <button className="mt-1 text-xs font-medium text-[#2563EB] hover:underline">
                    Add to listing
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
