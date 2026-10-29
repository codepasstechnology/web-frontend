import { agencyInitials } from "@/lib/listingAgency";

/**
 * An agency's logo on a white tile, or its initials in its brand colour when
 * it hasn't uploaded one. Styled inline so it sits the same on the map,
 * marketing and dashboard pages, which each have their own stylesheet.
 */
export function AgencyLogo({
  name,
  logoUrl,
  brandColor,
  size = 44,
  radius,
}: {
  name: string;
  logoUrl: string | null;
  brandColor: string | null;
  size?: number;
  radius?: number;
}) {
  const r = radius ?? Math.round(size * 0.28);

  if (logoUrl) {
    return (
      <span
        style={{
          width: size,
          height: size,
          borderRadius: r,
          flex: "none",
          background: "#fff",
          border: "1px solid rgba(0,0,0,0.08)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <img
          src={logoUrl}
          alt={`${name} logo`}
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      </span>
    );
  }

  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: r,
        flex: "none",
        background: brandColor ?? "#3f5a2a",
        color: "#fff",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: Math.round(size * 0.38),
        letterSpacing: "0.02em",
      }}
    >
      {agencyInitials(name)}
    </span>
  );
}
