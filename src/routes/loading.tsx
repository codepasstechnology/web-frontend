import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { LoadingScreen } from "@/components/auth/LoadingScreen";

// The screen stays at least this long so it doesn't flash.
const MIN_MS = 1500;
const FADE_MS = 400;

export const Route = createFileRoute("/loading")({
  head: () => ({ meta: [{ title: "Loading — Geo Pin Properties Kenya" }] }),
  validateSearch: (s: Record<string, unknown>) => ({
    mode: s.mode === "signup" ? ("signup" as const) : ("login" as const),
  }),
  component: LoadingPage,
});

export function LoadingPage() {
  const { mode } = Route.useSearch();
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    const timer = window.setTimeout(() => setFading(true), MIN_MS);
    return () => window.clearTimeout(timer);
  }, [ready, user, navigate]);

  useEffect(() => {
    if (!fading || !user) return;
    const timer = window.setTimeout(() => {
      if (user.role === "account_manager") {
        navigate({ to: "/manager" });
      } else {
        navigate({ to: "/dashboard", search: { tab: undefined } });
      }
    }, FADE_MS);
    return () => window.clearTimeout(timer);
  }, [fading, user, navigate]);

  return <LoadingScreen mode={mode} name={user?.fullName ?? ""} fading={fading} />;
}
