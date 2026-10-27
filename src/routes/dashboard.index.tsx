import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DashboardShell, type DashTab } from "@/components/DashboardShell";
import { UpgradeModal } from "@/components/UpgradeModal";
import { CheckoutModal } from "@/components/CheckoutModal";
import { useAuth } from "@/lib/auth";
import { usePlans, type Plan } from "@/lib/plans";
import { useUsedListings } from "@/lib/properties";
import { ListingsTab } from "@/components/dashboard/ListingsTab";
import { OverviewTab } from "@/components/dashboard/OverviewTab";
import { AnalyticsTab } from "@/components/dashboard/AnalyticsTab";
import { BillingTab, CancelPlanDialog } from "@/components/dashboard/BillingTab";
import { SettingsTab } from "@/components/dashboard/SettingsTab";
import { KycTab } from "@/components/dashboard/KycTab";
import { MARKETING_FONT_LINKS } from "@/components/site/marketingFonts";

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
    } else if (user && user.plan !== "free") {
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
  const goTab = (t: DashTab) => navigate({ to: "/dashboard", search: { tab: t } });
  const freeListings = plans.find((p) => p.id === "free")?.listings ?? null;

  return (
    <DashboardShell active={tab} onChange={setTab} onUpgrade={() => setUpgradeOpen(true)}>
      {tab === "overview" && (
        <OverviewTab user={user} onUpgrade={() => setUpgradeOpen(true)} onGoTab={goTab} />
      )}

      {tab === "listings" && <ListingsTab />}

      {tab === "analytics" && (
        <AnalyticsTab onUpgrade={() => setUpgradeOpen(true)} onGoTab={goTab} />
      )}

      {tab === "billing" && (
        <BillingTab
          plan={user.plan}
          billingCycle={user.billingCycle}
          planStatus={user.planStatus}
          planEndsAt={user.planEndsAt}
          planCancelledAt={user.planCancelledAt}
          plans={plans}
          maxListings={user.maxListings}
          usedListings={usedListings}
          payments={user.payments}
          onSelectPlan={handleSelectPlan}
          manager={user.manager}
        />
      )}

      {tab === "settings" && (
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

      {tab === "kyc" && <KycTab />}

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
        freeListings={freeListings === Infinity ? null : freeListings}
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
