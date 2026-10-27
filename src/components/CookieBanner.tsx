import { useEffect } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { setConsent, syncConsent, useCookieConsent, type Consent } from "@/lib/consent";
import { forgetVisitor, trackPageView } from "@/lib/traffic";

/** Applies a choice from the banner or the Cookie settings page. */
export function chooseCookies(choice: Consent, source: "banner" | "settings" = "banner"): void {
  setConsent(choice, source);
  if (choice === "all") trackPageView(window.location.pathname);
}

const linkClass = "font-medium text-primary underline underline-offset-4";

export function CookieBanner() {
  const { ready, consent } = useCookieConsent();
  const { user } = useAuth();
  const { pathname } = useLocation();
  const userId = user?.id;

  useEffect(() => {
    void syncConsent(!!userId);
  }, [userId]);

  // However "essential" was reached (here, on the settings page, on another
  // device, or the browser's privacy signal), the analytics ids go with it.
  useEffect(() => {
    if (consent === "essential") forgetVisitor();
  }, [consent]);

  if (!ready || consent || pathname === "/cookie-settings") return null;

  return (
    <section
      role="dialog"
      aria-label="Cookie preferences"
      className="fixed inset-x-4 bottom-4 z-[1000] mx-auto max-w-xl rounded-xl border border-border bg-background p-4 text-foreground shadow-lg sm:p-5"
    >
      <h2 className="text-sm font-semibold">
        Do you mind if we use optional cookies to analyse site traffic and improve Geo Pin
        Properties?
      </h2>
      <p className="mt-1.5 text-sm text-muted-foreground">
        We don&apos;t use many cookies, and you can see and manage them at any time on our{" "}
        <Link to="/cookie-settings" className={linkClass}>
          Cookie settings
        </Link>{" "}
        page. If you click &lsquo;Accept all&rsquo;, you agree to optional cookies on Geo Pin
        Properties. Learn more in our{" "}
        <Link to="/cookie-policy" className={linkClass}>
          Cookie policy
        </Link>
        .
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:justify-end">
        <Button variant="outline" onClick={() => chooseCookies("essential")}>
          Reject all
        </Button>
        <Button onClick={() => chooseCookies("all")}>Accept all</Button>
      </div>
    </section>
  );
}
