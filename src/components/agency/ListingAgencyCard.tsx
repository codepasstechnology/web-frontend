import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { CalendarClock, ChevronRight, Mail } from "lucide-react";
import { AgencyLogo } from "@/components/agency/AgencyLogo";
import { LeadSheet } from "@/components/agency/LeadSheet";
import type { ListingAgency } from "@/lib/listingAgency";

/**
 * "Listed by Kilimani Homes" in a listing panel: the brand, who handles the
 * listing, a link to everything the agency has listed, and ways to reach it.
 */
export function ListingAgencyCard({
  agency,
  anchor,
  kind,
  listingId,
  listingTitle,
  project,
}: {
  agency: ListingAgency;
  anchor: HTMLElement | null;
  kind: "parcel" | "property";
  listingId: string;
  listingTitle: string;
  project?: string | null;
}) {
  const [lead, setLead] = useState<"message" | "viewing" | null>(null);

  return (
    <div
      className="gm-agency"
      style={{ ["--brand" as string]: agency.brandColor ?? "var(--accent)" }}
    >
      <Link to="/agency/$slug" params={{ slug: agency.slug }} className="gm-agency-head">
        <AgencyLogo
          name={agency.name}
          logoUrl={agency.logoUrl}
          brandColor={agency.brandColor}
          size={48}
        />
        <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0, flex: 1 }}>
          <span className="gm-flab">Listed by</span>
          <strong style={{ fontSize: 16 }}>{agency.name}</strong>
          {agency.agent && (
            <span style={{ fontSize: 13, color: "var(--muted)" }}>
              Your agent: {agency.agent.name}
            </span>
          )}
        </span>
        <ChevronRight width={18} height={18} aria-hidden />
      </Link>
      {project && <span style={{ fontSize: 13, color: "var(--muted)" }}>Part of {project}</span>}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" className="gm-act2" onClick={() => setLead("viewing")}>
          <CalendarClock width={16} height={16} aria-hidden /> Request a viewing
        </button>
        <button type="button" className="gm-act2" onClick={() => setLead("message")}>
          <Mail width={16} height={16} aria-hidden /> Send a message
        </button>
      </div>
      <Link
        to="/agency/$slug"
        params={{ slug: agency.slug }}
        className="gm-link"
        style={{ fontSize: 14 }}
      >
        View all listings from {agency.name}
      </Link>
      {lead && (
        <LeadSheet
          anchor={anchor}
          agency={agency}
          kind={kind}
          listingId={listingId}
          listingTitle={listingTitle}
          mode={lead}
          onClose={() => setLead(null)}
        />
      )}
    </div>
  );
}
