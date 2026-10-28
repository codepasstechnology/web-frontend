import { createFileRoute, notFound } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MARKETING_FONT_LINKS } from "@/components/site/marketingFonts";
import { MarketingShell } from "@/components/site/MarketingShell";
import { AgencyListings, ProjectCards } from "@/components/agency/page/AgencyListings";
import { NO_FILTERS, type ListingFilters } from "@/components/agency/page/filters";
import {
  AboutSection,
  AgencyHeader,
  DetailsPanel,
  OwnerChecklist,
  StatsStrip,
} from "@/components/agency/page/AgencyProfileParts";
import { AgencyReviews } from "@/components/agency/page/AgencyReviews";
import { BookViewing, ShareSheet, StickyContact } from "@/components/agency/page/AgencyDialogs";
import { displayUrl, pageUrl, waLink } from "@/components/agency/page/helpers";
import {
  agencyQuery,
  responseLabel,
  useAgency,
  useAgencyPageListings,
  useReportAgency,
  visitSource,
  type AgencyTab,
} from "@/lib/agency";
import { api, API_BASE } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import "@/components/agency/agency-page.css";

export const Route = createFileRoute("/agency/$slug")({
  loader: async ({ params, context }) => {
    try {
      return await context.queryClient.ensureQueryData(agencyQuery(params.slug));
    } catch (error) {
      if ((error as { status?: number }).status === 404) throw notFound();
      throw error;
    }
  },
  head: ({ loaderData: agency, params }) => {
    if (!agency) return { links: MARKETING_FONT_LINKS };
    const title = `${agency.name} — Geo Pin Properties Kenya`;
    const description =
      agency.tagline ??
      `${agency.stats.listings} listings from ${agency.name} on Geo Pin Properties.`;
    const image = `${API_BASE}/og/agency/${params.slug}.png`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:image", content: image },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:image", content: image },
      ],
      links: MARKETING_FONT_LINKS,
    };
  },
  component: AgencyPage,
});

/** "Kilimani Homes & Property Management Ltd" → "Kilimani Homes", for buttons and headings. */
function shortNameOf(name: string): string {
  return name.split(/\s+(?:&|and)\s+|,|\s+(?:Ltd|Limited)\b/i)[0].trim() || name;
}

function AgencyPage() {
  const { slug } = Route.useParams();
  const { data: agency } = useAgency(slug);
  const { user } = useAuth();
  const listings = useAgencyPageListings(slug);
  const reportAgency = useReportAgency(slug);

  const [tab, setTab] = useState<AgencyTab>("all");
  const [filters, setFilters] = useState<ListingFilters>(NO_FILTERS);
  const [view, setView] = useState<"grid" | "map">("grid");
  const [sharing, setSharing] = useState(false);
  const [booking, setBooking] = useState(false);
  const [reported, setReported] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    api.post(`/agencies/${slug}/visit`, { source: visitSource() }).catch(() => {});
  }, [slug]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  const url = useMemo(() => pageUrl(slug), [slug]);
  const showToast = useCallback((text: string) => setToast(text), []);

  if (!agency) return null;

  const shortName = shortNameOf(agency.name);
  const waHref = waLink(
    agency.whatsapp ?? agency.phone,
    `Hi ${agency.name}, I found you on Geo Pin. ${url}`,
  );
  const owner = user?.agency?.slug === agency.slug && user.agency.role !== "agent";

  const toListings = () =>
    document.getElementById("listings")?.scrollIntoView({ behavior: "smooth", block: "start" });
  const narrow = (patch: Partial<ListingFilters>) => {
    setTab("all");
    setFilters({ ...filters, ...patch });
    toListings();
  };

  const share = () => {
    const phone = window.matchMedia("(max-width: 700px)").matches;
    if (phone && navigator.share) {
      navigator.share({ title: agency.name, url }).catch(() => {});
    } else {
      setSharing(true);
    }
  };

  const report = async () => {
    const reason = window.prompt(`What's wrong with ${agency.name}?`);
    if (!reason || reason.trim().length < 5) return;
    await reportAgency.mutateAsync(reason.trim()).catch(() => {});
    setReported(true);
  };

  return (
    <MarketingShell>
      <div className="ag-page">
        <AgencyHeader
          agency={agency}
          waHref={waHref}
          urlText={displayUrl(url)}
          onShare={share}
          onBook={() => setBooking(true)}
        />
        {owner && <OwnerChecklist agency={agency} />}
        <StatsStrip agency={agency} />

        <div className="gs-wrap ag-main">
          <div className="ag-col">
            <AboutSection
              agency={agency}
              projects={
                <ProjectCards
                  agency={agency}
                  selected={filters.project}
                  onSelect={(project) => narrow({ project })}
                />
              }
            />
            <AgencyListings
              agency={agency}
              live={listings.data?.live ?? []}
              closed={listings.data?.closed ?? []}
              loading={listings.isLoading}
              tab={tab}
              onTab={setTab}
              filters={filters}
              onFilters={setFilters}
              view={view}
              onView={setView}
              pageUrl={url}
            />
            {agency.reviewsEnabled && <AgencyReviews agency={agency} shortName={shortName} />}
          </div>
          <DetailsPanel
            agency={agency}
            county={filters.county}
            onCounty={(county) => narrow({ county })}
            onCoverage={() => {
              setView("map");
              toListings();
            }}
            onBook={() => setBooking(true)}
            onReport={report}
            reported={reported}
          />
        </div>

        {sharing && (
          <ShareSheet
            agency={agency}
            shortName={shortName}
            url={url}
            onClose={() => setSharing(false)}
            onToast={showToast}
          />
        )}
        {booking && (
          <BookViewing
            agency={agency}
            shortName={shortName}
            listings={listings.data?.live ?? []}
            waHref={waHref}
            onClose={() => setBooking(false)}
          />
        )}
        <StickyContact
          shortName={shortName}
          reply={responseLabel(agency.responseMinutes)}
          phone={agency.phone}
          waHref={waHref}
        />
        {toast && (
          <div className="ag-toast" role="status">
            {toast}
          </div>
        )}
      </div>
    </MarketingShell>
  );
}
