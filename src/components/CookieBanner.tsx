import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { setConsent, syncConsent, useCookieConsent, type Consent } from "@/lib/consent";
import { forgetVisitor, trackPageView } from "@/lib/traffic";

export function CookieBanner() {
  const { ready, consent, settingsOpen } = useCookieConsent();
  const { user } = useAuth();
  const userId = user?.id;

  useEffect(() => {
    void syncConsent(!!userId);
  }, [userId]);

  // However "essential" was reached (here, on another device, or the browser's
  // privacy signal), the analytics ids go with it.
  useEffect(() => {
    if (consent === "essential") forgetVisitor();
  }, [consent]);

  if (!ready || (consent && !settingsOpen)) return null;

  const choose = (choice: Consent) => {
    setConsent(choice);
    if (choice === "all") trackPageView(window.location.pathname);
  };

  return (
    <section
      role="dialog"
      aria-label="Cookie preferences"
      className="fixed inset-x-4 bottom-4 z-[1000] mx-auto max-w-xl rounded-xl border border-border bg-background p-4 text-foreground shadow-lg sm:p-5"
    >
      <h2 className="text-sm font-semibold">Cookies on Geo Pin</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">
        We always store what the site needs to work, like keeping you signed in, and count page
        views anonymously. With your OK, we also remember this browser to see which pages are opened
        and where visitors come from, to improve Geo Pin. We don't use advertising cookies or sell
        your data.{" "}
        <Link
          to="/cookie-policy"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Cookie policy
        </Link>
      </p>
      {consent && (
        <p className="mt-2 text-sm font-medium">
          Your current choice: {consent === "all" ? "analytics allowed" : "essential only"}.
        </p>
      )}
      <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={() => choose("essential")}>
          Essential only
        </Button>
        <Button onClick={() => choose("all")}>Accept analytics</Button>
      </div>
    </section>
  );
}
