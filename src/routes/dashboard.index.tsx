import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DashboardShell, type DashTab } from "@/components/DashboardShell";
import { UpgradeModal } from "@/components/UpgradeModal";
import { CheckoutModal } from "@/components/CheckoutModal";
import { useAuth } from "@/lib/auth";
import { freePlanFor, usePlans, type Plan } from "@/lib/plans";
import { useUsedListings } from "@/lib/properties";
import { ListingsTab } from "@/components/dashboard/ListingsTab";
import { OverviewTab } from "@/components/dashboard/OverviewTab";
import { AnalyticsTab } from "@/components/dashboard/AnalyticsTab";
import { BillingTab, CancelPlanDialog } from "@/components/dashboard/BillingTab";
import { SettingsTab } from "@/components/dashboard/SettingsTab";
import { KycTab } from "@/components/dashboard/KycTab";
import { AgencyTab } from "@/components/dashboard/AgencyTab";
import { LeadsTab } from "@/components/dashboard/LeadsTab";
import { TeamTab } from "@/components/dashboard/TeamTab";
import { InsightsTab } from "@/components/dashboard/InsightsTab";
import { BecomeAgencyCard } from "@/components/dashboard/BecomeAgencyCard";
import { MARKETING_FONT_LINKS } from "@/components/site/marketingFonts";

const AGENCY_TABS: DashTab[] = ["agency", "leads", "team", "insights"];

export const Route = createFileRoute("/dashboard/")({
  head: () => ({
    meta: [{ title: "Dashboard — Geo Pin Properties Kenya" }],
    links: MARKETING_FONT_LINKS,
  }),
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => {
    const allowed: DashTab[] = [
      "overview",
      "listings",
      "upload",
      "analytics",
      "billing",
      "settings",
      "kyc",
      ...AGENCY_TABS,
    ];
    // "properties" was its own tab before land and rentals were merged; keep
    // old links and bookmarks landing on the combined list.
    const raw = s.tab === "properties" ? "listings" : s.tab;
    const t =
      typeof raw === "string" && (allowed as string[]).includes(raw) ? (raw as DashTab) : undefined;
    return { tab: t };
  },
  component: DashboardPage,
});

function DashboardPage() {
  const {
    user,
    ready,
    updateUser,
    deleteAccount,
    logout,
    changePassword,
    enableTwoFactor,
    confirmTwoFactor,
    disableTwoFactor,
    requestEmailChange,
    confirmEmailChange,
  } = useAuth();
  const { data: plans = [] } = usePlans();
  const usedListings = useUsedListings();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [tab, setTab] = useState<DashTab>(search.tab ?? "overview");
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<Plan | null>(null);
  const [checkoutCycle, setCheckoutCycle] = useState<"monthly" | "yearly" | undefined>(undefined);

  // Free has no checkout: moving to it is a cancellation of the paid plan.
  const handleSelectPlan = (id: string, cycle?: "monthly" | "yearly") => {
    const selected = plans.find((p) => p.id === id);
    if (selected && selected.price > 0) {
      setCheckoutCycle(cycle);
      setCheckoutPlan(selected);
    } else if (user && (plans.find((p) => p.id === user.plan)?.price ?? 0) > 0) {
      setCancelOpen(true);
    }
  };
  useEffect(() => {
    if (search.tab && search.tab !== tab) setTab(search.tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.tab]);

  useEffect(() => {
    if (ready && !user) navigate({ to: "/login" });
    else if (ready && user?.role === "account_manager") navigate({ to: "/manager" });
  }, [ready, user, navigate]);

  if (!user || user.role === "account_manager") return null;
  // Agency tabs only exist for agency members; anyone else lands on the overview.
  const shown: DashTab = AGENCY_TABS.includes(tab) && !user.agency ? "overview" : tab;
  const goTab = (t: DashTab) => navigate({ to: "/dashboard", search: { tab: t } });

  return (
    <DashboardShell active={shown} onChange={setTab} onUpgrade={() => setUpgradeOpen(true)}>
      {shown === "overview" && (
        <OverviewTab user={user} onUpgrade={() => setUpgradeOpen(true)} onGoTab={goTab} />
      )}

      {shown === "listings" && <ListingsTab />}

      {shown === "agency" && <AgencyTab />}
      {shown === "leads" && <LeadsTab />}
      {shown === "team" && <TeamTab />}
      {shown === "insights" && <InsightsTab />}

      {shown === "analytics" && (
        <AnalyticsTab onUpgrade={() => setUpgradeOpen(true)} onGoTab={goTab} />
      )}

      {shown === "billing" && (
        <BillingTab
          plan={user.plan}
          billingCycle={user.billingCycle}
          planStatus={user.planStatus}
          planEndsAt={user.planEndsAt}
          planCancelledAt={user.planCancelledAt}
          plans={plans}
          agencyRole={user.agency?.role}
          maxListings={user.maxListings}
          usedListings={usedListings}
          payments={user.payments}
          onSelectPlan={handleSelectPlan}
          manager={user.manager}
        />
      )}

      {shown === "settings" && !user.agency && <BecomeAgencyCard />}

      {shown === "settings" && (
        <SettingsTab
          user={user}
          onUpdate={updateUser}
          onDelete={async () => {
            await deleteAccount();
            navigate({ to: "/" });
          }}
          onLogout={() => {
            logout();
            navigate({ to: "/" });
          }}
          onChangePassword={changePassword}
          onSignedOut={() => navigate({ to: "/login" })}
          onEnableTwoFactor={enableTwoFactor}
          onConfirmTwoFactor={confirmTwoFactor}
          onDisableTwoFactor={disableTwoFactor}
          onRequestEmailChange={requestEmailChange}
          onConfirmEmailChange={confirmEmailChange}
        />
      )}

      {shown === "kyc" && <KycTab />}

      <UpgradeModal
        open={upgradeOpen}
        currentPlan={user.plan}
        onClose={() => setUpgradeOpen(false)}
        onSelect={handleSelectPlan}
      />

      <CancelPlanDialog
        open={cancelOpen}
        planName={plans.find((p) => p.id === user.plan)?.name ?? user.plan}
        endsAt={user.planEndsAt}
        freePlan={freePlanFor(plans, !!user.agency)}
        onClose={() => setCancelOpen(false)}
      />

      {checkoutPlan && (
        <CheckoutModal
          plan={checkoutPlan}
          initialCycle={checkoutCycle}
          onClose={() => {
            setCheckoutPlan(null);
            setCheckoutCycle(undefined);
          }}
        />
      )}
    </DashboardShell>
  );
}
