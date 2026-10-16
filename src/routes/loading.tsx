import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
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
  const router = useRouter();
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    // Fade only once the minimum time has passed and the destination's code is loaded,
    // so the dashboard never appears on a blank page.
    const minimum = new Promise<void>((resolve) => window.setTimeout(resolve, MIN_MS));
    const preload =
      user.role === "account_manager"
        ? router.preloadRoute({ to: "/manager" })
        : router.preloadRoute({ to: "/dashboard", search: { tab: undefined } });
    let cancelled = false;
    void Promise.all([minimum, preload]).then(() => {
      if (!cancelled) setFading(true);
    });
    return () => {
      cancelled = true;
    };
  }, [ready, user, navigate, router]);

  useEffect(() => {
    if (!fading || !user) return;
    const timer = window.setTimeout(() => {
      // A buyer sent to sign in from a listing (Save, Request verification) goes back to it.
      let back: string | null = null;
      try {
        back = sessionStorage.getItem("lv_return_to");
        sessionStorage.removeItem("lv_return_to");
      } catch {
        /* storage unavailable */
      }
      if (user.role === "account_manager") {
        navigate({ to: "/manager" });
      } else if (back?.startsWith("/")) {
        navigate({ href: back });
      } else {
        navigate({ to: "/dashboard", search: { tab: undefined } });
      }
    }, FADE_MS);
    return () => window.clearTimeout(timer);
  }, [fading, user, navigate]);

  return <LoadingScreen mode={mode} name={user?.fullName ?? ""} fading={fading} />;
}
