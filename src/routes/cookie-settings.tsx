import type { ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { MarketingShell } from "@/components/site/MarketingShell";
import { PageHeader } from "@/components/site/PageHeader";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { chooseCookies } from "@/components/CookieBanner";
import { useCookieConsent, type Consent } from "@/lib/consent";

export const Route = createFileRoute("/cookie-settings")({
  head: () => ({ meta: [{ title: "Cookies & Browsing — Geo Pin Properties Kenya" }] }),
  component: CookieSettingsPage,
});

const ESSENTIAL: { name: string; text: string }[] = [
  { name: "lv_token_v1", text: "Keeps you signed in until you log out or your session expires." },
  {
    name: "gp_cookie_consent",
    text: "Stores the choices you make on this page or on the cookie banner.",
  },
  { name: "lv_theme", text: "Remembers whether you use light or dark mode." },
  { name: "gp_recent", text: "The listings you opened last, so you can find them again." },
  {
    name: "lv_upload_draft_v1, lv_property_draft_v1 and lv_draft_photos",
    text: "A listing you are still writing, with its photos, so nothing is lost if you leave the page.",
  },
  {
    name: "lv_return_to",
    text: "The page to bring you back to after you sign in. Cleared when you close the tab.",
  },
  {
    name: "lv_boundary_tutorial_seen",
    text: "Set once you've seen the tips for drawing your land's boundary on the map.",
  },
];

const THIRD_PARTY: { name: string; text: string; policy: string }[] = [
  {
    name: "Cloudflare",
    text: "Delivers the site securely and blocks attacks.",
    policy: "https://www.cloudflare.com/privacypolicy/",
  },
  {
    name: "Google Fonts",
    text: "Loads the text font used across the site.",
    policy: "https://policies.google.com/privacy",
  },
  {
    name: "Unsplash",
    text: "Background photos on the sign-in pages.",
    policy: "https://unsplash.com/privacy",
  },
  {
    name: "OpenStreetMap, CARTO and Esri",
    text: "Map and satellite images, and place search on the map.",
    policy: "https://osmfoundation.org/wiki/Privacy_Policy",
  },
  {
    name: "Google Sign-In",
    text: "Only loaded if you choose to sign in with Google.",
    policy: "https://policies.google.com/privacy",
  },
];

function Category({
  title,
  purpose,
  control,
  children,
}: {
  title: string;
  purpose: string;
  control?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 text-card-foreground md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{purpose}</p>
        </div>
        {control}
      </div>
      <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 text-sm">{children}</div>
    </section>
  );
}

function Item({ name, children }: { name: ReactNode; children: ReactNode }) {
  return (
    <div>
      <div className="font-mono text-[13px] font-semibold">{name}</div>
      <p className="mt-0.5 text-muted-foreground">{children}</p>
    </div>
  );
}

function CookieSettingsPage() {
  const { ready, consent, savedAt } = useCookieConsent();
  const analyticsOn = consent === "all";

  const apply = (choice: Consent) => {
    chooseCookies(choice, "settings");
    toast.success(
      choice === "all" ? "Optional cookies turned on." : "Optional cookies turned off.",
    );
  };

  return (
    <MarketingShell>
      <div className="min-h-screen bg-background text-foreground">
        <PageHeader eyebrow="Privacy" title="Cookies & Browsing">
          <p className="max-w-[60ch] text-muted-foreground">
            Use this page to choose which optional cookies Geo Pin may use. Changes apply straight
            away. Read the{" "}
            <Link to="/cookie-policy" className="font-medium text-primary underline">
              Cookie policy
            </Link>{" "}
            for the full details.
          </p>
          {ready && (
            <p className="text-sm text-muted-foreground">
              {consent
                ? `Your choice: optional cookies ${analyticsOn ? "on" : "off"}${
                    savedAt
                      ? `, saved ${new Date(savedAt).toLocaleDateString("en-KE", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}`
                      : ""
                  }.`
                : "You haven't made a choice yet, so optional cookies are off."}
            </p>
          )}
        </PageHeader>

        <main className="mx-auto flex max-w-[760px] flex-col gap-10 px-4 py-12 md:px-8 md:py-16">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold">Optional cookies</h2>
              <div className="flex gap-2">
                <Button variant="outline" disabled={!ready} onClick={() => apply("essential")}>
                  Reject all
                </Button>
                <Button disabled={!ready} onClick={() => apply("all")}>
                  Accept all
                </Button>
              </div>
            </div>

            <Category
              title="Geo Pin analytics"
              purpose="To measure how many people use Geo Pin, where they come from and which pages help them, so we can improve the site."
              control={
                <Switch
                  aria-label="Geo Pin analytics"
                  checked={analyticsOn}
                  disabled={!ready}
                  onCheckedChange={(on) => apply(on ? "all" : "essential")}
                />
              }
            >
              <Item name="gp_visitor">
                A random id for this browser, so repeat visits are counted once. Kept until you turn
                analytics off.
              </Item>
              <Item name="gp_session">
                Groups the pages you open in one visit. A visit ends after 30 minutes without a page
                view.
              </Item>
              <p className="text-muted-foreground">
                With these on, we see which pages are opened, the website or shared link you came
                from, your device type, and your country and town as reported by our network
                provider. If you&apos;re signed in, visits are linked to your account. We never sell
                this or use it for advertising, and delete page views after 12 months.
              </p>
            </Category>
          </div>

          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-bold">Always on</h2>

            <Category
              title="Anonymous visit counts"
              purpose="To know how much the site is used, even when optional cookies are off."
            >
              <p className="text-muted-foreground">
                Every page view adds one to that day&apos;s total, split only by device type and
                country. Nothing is stored in your browser for this, and nothing tells you apart
                from anyone else.
              </p>
            </Category>

            <Category
              title="Technically necessary"
              purpose="Stored in your browser whenever you use Geo Pin. The site can't work without them."
            >
              {ESSENTIAL.map((c) => (
                <Item key={c.name} name={c.name}>
                  {c.text}
                </Item>
              ))}
            </Category>

            <Category
              title="Services from other companies"
              purpose="Parts of the site load from these providers. They receive your IP address and may set their own cookies under their own privacy policies."
            >
              {THIRD_PARTY.map((c) => (
                <Item
                  key={c.name}
                  name={<span className="font-sans text-sm font-semibold">{c.name}</span>}
                >
                  {c.text}{" "}
                  <a
                    href={c.policy}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary underline"
                  >
                    Privacy policy
                  </a>
                </Item>
              ))}
            </Category>
          </div>

          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-bold">Browsing</h2>
            <Category
              title="Shared links and campaign links (UTM)"
              purpose="Listing links shared from Geo Pin carry a short code, and links in our adverts or partners' posts can carry UTM tags."
            >
              <p className="text-muted-foreground">
                When Geo Pin analytics is on, we use them to see which shared links and campaigns
                bring people to Geo Pin and lead to sign-ups, reported only as totals. Turning
                analytics off above stops this too.
              </p>
            </Category>
          </div>
        </main>
      </div>
    </MarketingShell>
  );
}
