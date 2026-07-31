import { createFileRoute, Link } from "@tanstack/react-router";
import {
  MapPinned,
  ShieldCheck,
  Activity,
  ArrowRight,
  Search,
  FileCheck,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Lock,
  Zap,
  Building2,
} from "lucide-react";
import { landParcels, statusMeta } from "@/lib/landData";

export const Route = createFileRoute("/")({
  component: Index,
});

const testimonials = [
  {
    quote:
      "We verified three parcels in Kajiado before committing. Geo Properties flagged a boundary dispute the seller never disclosed. Saved us millions.",
    name: "James Mwangi",
    role: "Property Investor · Nairobi",
    initials: "JM",
    stat: "KES 2.4M",
    statNote: "in losses avoided on one transaction",
  },
  {
    quote:
      "The development score alone is worth it. We cross-reference every site acquisition with Geo Properties before presenting to our board.",
    name: "Aisha Odhiambo",
    role: "Real Estate Analyst · Mombasa",
    initials: "AO",
  },
  {
    quote:
      "I was buying my first plot and didn't know where to start. The ownership trail and GPS boundaries gave me confidence the title was clean.",
    name: "Peter Kamau",
    role: "First-time Buyer · Nakuru",
    initials: "PK",
  },
];

function Index() {
  const verifiedCount = landParcels.filter((p) => p.verified).length;
  const countiesSet = new Set(landParcels.map((p) => p.county));

  return (
    <div className="min-h-screen bg-black">
      {/* ── Hero ── */}
      <section className="relative flex min-h-[90vh] items-center overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1920&q=90&auto=format&fit=crop"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-center"
          fetchPriority="high"
          draggable={false}
        />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />

        <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-12 px-4 py-20 md:grid-cols-2 md:py-28">
          <div className="flex flex-col justify-center">
            <h1 className="text-4xl font-bold tracking-tight text-white drop-shadow md:text-5xl lg:text-6xl">
              Verified land & property intelligence for Kenya.
            </h1>
            <p className="mt-4 max-w-xl text-base text-white/70">
              Explore plotted parcels with accurate boundaries, ownership status, and location
              insights — all on one professional GIS platform.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/land"
                className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-900/50 transition-all hover:bg-[#1d4ed8] active:scale-[0.98]"
              >
                Explore Land Map <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/rentals"
                className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20 active:scale-[0.98]"
              >
                Browse Rentals <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <dl className="mt-10 grid grid-cols-3 gap-6 border-t border-white/10 pt-6">
              <Metric label="Parcels mapped" value={landParcels.length.toString()} />
              <Metric label="Verified" value={verifiedCount.toString()} />
              <Metric label="Counties" value={countiesSet.size.toString()} />
            </dl>
          </div>

          <div className="relative flex items-center">
            <div className="w-full rounded-2xl border border-white/20 bg-white/10 shadow-2xl shadow-black/50 backdrop-blur-2xl">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-white">
                  <MapPinned className="h-3.5 w-3.5 text-emerald-400" />
                  Live Parcel Index
                </div>
                <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white/50 backdrop-blur-sm">
                  Sample
                </span>
              </div>
              <ul className="divide-y divide-white/10">
                {landParcels.slice(0, 5).map((p) => {
                  const m = statusMeta[p.status];
                  return (
                    <li
                      key={p.id}
                      className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-white/5"
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-sm"
                        style={{ backgroundColor: m.color }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white">{p.title}</p>
                        <p className="truncate text-[11px] text-white/50">
                          {p.parcelNumber} · {p.county}
                        </p>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-300">
                        KES {(p.price / 1_000_000).toFixed(1)}M
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Platform features ── */}
      <section className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-12 lg:grid-cols-[1fr_440px] lg:gap-20 xl:grid-cols-[1fr_500px]">
            {/* Left */}
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-[#0F172A] md:text-4xl">
                Not just listings.
                <br />
                Land intelligence.
              </h2>
              <p className="mt-4 max-w-lg text-base leading-relaxed text-[#475569]">
                Every parcel comes with verified data points that go far beyond photos and asking
                price — so you know exactly what you're committing to.
              </p>

              <div className="mt-10 grid gap-6 sm:grid-cols-2">
                {[
                  {
                    icon: MapPinned,
                    title: "GPS polygon boundaries",
                    body: "Exact parcel shape, area, and neighbors — not a pin on a map.",
                  },
                  {
                    icon: ShieldCheck,
                    title: "Ownership chain",
                    body: "Full title deed history from the original allotment through every subsequent transfer.",
                  },
                  {
                    icon: Activity,
                    title: "Encumbrance flags",
                    body: "Active cautions, caveats, and disputes surfaced before you commit.",
                  },
                  {
                    icon: BarChart3,
                    title: "Development score",
                    body: "12-factor location score: infrastructure, amenities, growth trajectory.",
                  },
                ].map(({ icon: Icon, title, body }) => (
                  <div key={title} className="flex gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EFF6FF] text-[#2563EB]">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#0F172A]">{title}</p>
                      <p className="mt-0.5 text-sm text-[#475569]">{body}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                to="/land"
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1d4ed8]"
              >
                Explore the platform <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Right: parcel report mockup */}
            <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
                  Parcel Report
                </p>
                <span className="rounded-full bg-[#DCFCE7] px-2 py-0.5 text-[10px] font-bold text-[#16A34A]">
                  ● Verified
                </span>
              </div>

              {/* Map mock */}
              <div className="overflow-hidden rounded-xl border border-[#E2E8F0]">
                <svg viewBox="0 0 400 180" className="w-full">
                  <rect width="400" height="180" fill="#EFF6FF" />
                  {[50, 100, 150, 200, 250, 300, 350].map((x) => (
                    <line
                      key={x}
                      x1={x}
                      y1="0"
                      x2={x}
                      y2="180"
                      stroke="#BFDBFE"
                      strokeWidth="0.5"
                    />
                  ))}
                  {[45, 90, 135].map((y) => (
                    <line
                      key={y}
                      x1="0"
                      y1={y}
                      x2="400"
                      y2={y}
                      stroke="#BFDBFE"
                      strokeWidth="0.5"
                    />
                  ))}
                  <polygon
                    points="110,38 270,32 288,125 242,150 105,140"
                    fill="#BFDBFE"
                    stroke="#2563EB"
                    strokeWidth="2"
                    fillOpacity="0.6"
                  />
                  <circle cx="192" cy="90" r="6" fill="#2563EB" />
                  <circle cx="192" cy="90" r="14" fill="#2563EB" fillOpacity="0.12" />
                  {/* Adjacent flagged parcel */}
                  <polygon
                    points="292,38 368,44 362,115 288,118"
                    fill="#FEF3C7"
                    stroke="#F59E0B"
                    strokeWidth="1.5"
                    fillOpacity="0.5"
                  />
                </svg>
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-2">
                {[
                  { label: "Parcel no.", value: "KJA/KAJ/0149" },
                  { label: "Area", value: "0.25 ha" },
                  { label: "Status", value: "Available" },
                  { label: "Dev score", value: "78 / 100" },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-2"
                  >
                    <p className="text-[10px] text-[#94A3B8]">{label}</p>
                    <p className="mt-0.5 text-xs font-semibold text-[#0F172A]">{value}</p>
                  </div>
                ))}
              </dl>

              <div className="mt-2 rounded-lg border border-[#E2E8F0] bg-white px-3 py-2.5">
                <p className="text-[10px] text-[#94A3B8]">Ownership trail</p>
                <p className="mt-0.5 text-xs font-medium text-[#0F172A]">
                  M. Wanjiku → J. Otieno (2019) → Current holder
                </p>
                <p className="mt-1 flex items-center gap-1 text-[10px] text-[#16A34A]">
                  <CheckCircle2 className="h-3 w-3" /> No encumbrances on this parcel
                </p>
              </div>

              <div className="mt-2 rounded-lg border border-[#FEF3C7] bg-[#FFFBEB] px-3 py-2">
                <p className="text-[10px] font-semibold text-[#B45309]">
                  ⚠ Adjacent parcel KJA/KAJ/0150 has an active boundary caveat
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="border-y border-[#E2E8F0] bg-[#F8FAFC] px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl font-bold text-[#0F172A] md:text-3xl">
            From search to confident decision — in minutes.
          </h2>
          <p className="mt-2 text-sm text-[#475569]">No specialist knowledge required.</p>

          <div className="relative mt-14">
            {/* Connector line — desktop */}
            <div className="absolute left-7 right-7 top-7 hidden h-px bg-[#E2E8F0] md:block" />

            <div className="grid gap-10 md:grid-cols-3 md:gap-8">
              {[
                {
                  n: "01",
                  icon: Search,
                  title: "Search by location or title",
                  body: "Enter a county, title number, or area. Filter by parcel size, price, and verification status in real time.",
                },
                {
                  n: "02",
                  icon: FileCheck,
                  title: "Review the intelligence report",
                  body: "GPS boundaries, ownership history, and encumbrances — aggregated and cross-checked automatically.",
                },
                {
                  n: "03",
                  icon: BarChart3,
                  title: "Decide with confidence",
                  body: "Compare parcels on development scores, infrastructure ratings, and proximity to amenities. Download a shareable report.",
                },
              ].map(({ n, icon: Icon, title, body }) => (
                <div key={n}>
                  <div className="relative mb-5 flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#E2E8F0] bg-white shadow-sm">
                    <span className="text-xs font-bold text-[#0F172A]">{n}</span>
                  </div>
                  <Icon className="mb-2.5 h-5 w-5 text-[#2563EB]" />
                  <h3 className="text-sm font-bold text-[#0F172A]">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#475569]">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section className="bg-[#0F172A] px-4 py-14">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              {
                value: landParcels.length.toString(),
                label: "Parcels indexed",
                note: "and growing",
              },
              { value: verifiedCount.toString(), label: "Verified titles", note: "cross-checked" },
              { value: countiesSet.size.toString(), label: "Counties covered", note: "Kenya-wide" },
              { value: "12+", label: "Intelligence factors", note: "per development score" },
            ].map(({ value, label, note }) => (
              <div key={label} className="text-center md:text-left">
                <p className="text-3xl font-bold text-white md:text-4xl">{value}</p>
                <p className="mt-1 text-sm font-semibold text-white/70">{label}</p>
                <p className="text-[11px] text-white/35">{note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Who it's for ── */}
      <section className="border-b border-[#E2E8F0] bg-white px-4 py-20">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-2xl font-bold text-[#0F172A] md:text-3xl">
            Built for everyone in the land transaction.
          </h2>
          <p className="mt-3 text-sm text-[#475569]">
            Whether you're buying your first plot or managing a portfolio of 50.
          </p>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              {
                tag: "Individual buyers",
                headline: "Know exactly what you're buying.",
                points: [
                  "Boundary disputes flagged before signing",
                  "Ownership history traceable in one click",
                  "No surprise encumbrances post-purchase",
                ],
                cta: "Start free",
                to: "/register" as const,
              },
              {
                tag: "Agents & agencies",
                headline: "Close faster with verified listings.",
                points: [
                  "Verified badge builds buyer confidence",
                  "Bulk parcel exports for portfolios",
                  "Client-shareable PDF reports",
                ],
                cta: "View agency plans",
                to: "/pricing" as const,
              },
              {
                tag: "Lawyers & SACCO lenders",
                headline: "Due diligence in minutes, not weeks.",
                points: [
                  "Full ownership chain on demand",
                  "Encumbrance & caution search",
                  "API access for workflow integration",
                ],
                cta: "Explore Pro",
                to: "/pricing" as const,
              },
            ].map(({ tag, headline, points, cta, to }) => (
              <div key={tag} className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-6">
                <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">
                  {tag}
                </span>
                <p className="mt-2 text-base font-semibold text-[#0F172A]">{headline}</p>
                <ul className="mt-4 space-y-2.5">
                  {points.map((point) => (
                    <li key={point} className="flex items-start gap-2 text-sm text-[#475569]">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#16A34A]" />
                      {point}
                    </li>
                  ))}
                </ul>
                <Link
                  to={to}
                  className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-[#2563EB] hover:underline"
                >
                  {cta} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="border-b border-[#E2E8F0] bg-[#F8FAFC] px-4 py-20">
        <div className="mx-auto max-w-7xl">
          <p className="mb-10 text-xs font-bold uppercase tracking-widest text-[#2563EB]">
            Trusted by buyers & investors
          </p>

          {/* Featured */}
          <div className="mb-5 rounded-2xl border border-[#E2E8F0] bg-white p-8 md:p-10 lg:flex lg:items-start lg:gap-12">
            <div className="flex-1">
              <p className="text-xl font-semibold leading-relaxed text-[#0F172A] md:text-2xl">
                "{testimonials[0].quote}"
              </p>
              <div className="mt-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2563EB] text-xs font-bold text-white">
                  {testimonials[0].initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#0F172A]">{testimonials[0].name}</p>
                  <p className="text-xs text-[#94A3B8]">{testimonials[0].role}</p>
                </div>
              </div>
            </div>
            <div className="mt-6 rounded-xl bg-[#EFF6FF] px-6 py-5 text-center lg:mt-0 lg:w-44 lg:shrink-0">
              <p className="text-3xl font-bold text-[#2563EB]">{testimonials[0].stat}</p>
              <p className="mt-1 text-xs leading-snug text-[#475569]">{testimonials[0].statNote}</p>
            </div>
          </div>

          {/* Two smaller */}
          <div className="grid gap-5 md:grid-cols-2">
            {testimonials.slice(1).map(({ quote, name, role, initials }) => (
              <div key={name} className="rounded-xl border border-[#E2E8F0] bg-white p-6">
                <p className="text-sm leading-relaxed text-[#475569]">"{quote}"</p>
                <div className="mt-4 flex items-center gap-3 border-t border-[#F1F5F9] pt-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0F172A] text-[10px] font-bold text-white">
                    {initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0F172A]">{name}</p>
                    <p className="text-[11px] text-[#94A3B8]">{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-[#2563EB] px-4 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold text-white md:text-3xl">
            Kenya's most trusted land intelligence platform.
          </h2>
          <p className="mt-4 text-sm text-blue-100">
            Join thousands of buyers, investors, and agencies who verify before they commit.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/land"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-[#2563EB] shadow transition-all hover:bg-blue-50 active:scale-[0.98]"
            >
              Explore the Map <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/rentals"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-white/10 active:scale-[0.98]"
            >
              Browse Rentals
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
            {["No credit card required", "Free tier available", "Cross-checked parcel data"].map(
              (item) => (
                <span key={item} className="flex items-center gap-1.5 text-xs text-blue-100">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                  {item}
                </span>
              ),
            )}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/10 bg-[#0A1120]">
        <div className="mx-auto max-w-7xl px-4 py-14">
          <div className="grid gap-10 md:grid-cols-5">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#2563EB]">
                  <MapPinned className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-bold text-white">Geo Properties Kenya</span>
              </div>
              <p className="mt-4 max-w-xs text-xs leading-relaxed text-white/40">
                GIS-powered land intelligence for buyers, sellers, and investors across Kenya.
                Accurate boundaries, verified ownership, and location insights on one platform.
              </p>
            </div>

            <div>
              <p className="mb-4 text-[11px] font-bold uppercase tracking-widest text-white/30">
                Platform
              </p>
              <ul className="space-y-2.5">
                {[
                  { label: "Land Map", to: "/land" },
                  { label: "Rentals", to: "/rentals" },
                  { label: "Verified Parcels", to: "/land" },
                  { label: "Pricing", to: "/pricing" },
                ].map(({ label, to }) => (
                  <li key={label}>
                    <Link
                      to={to}
                      className="flex items-center gap-1 text-xs text-white/45 transition-colors hover:text-white"
                    >
                      <ChevronRight className="h-3 w-3" />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="mb-4 text-[11px] font-bold uppercase tracking-widest text-white/30">
                Resources
              </p>
              <ul className="space-y-2.5">
                {["Documentation", "API Reference", "Data Sources", "Changelog"].map((item) => (
                  <li key={item}>
                    <span className="flex cursor-default items-center gap-1 text-xs text-white/45">
                      <ChevronRight className="h-3 w-3" />
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="mb-4 text-[11px] font-bold uppercase tracking-widest text-white/30">
                Legal
              </p>
              <ul className="space-y-2.5">
                {[
                  { label: "Privacy Policy", to: "/privacy" },
                  { label: "Terms of Service", to: "/terms" },
                  { label: "Data Usage", to: "/data-usage" },
                  { label: "Cookie Policy", to: "/cookie-policy" },
                ].map(({ label, to }) => (
                  <li key={label}>
                    <Link
                      to={to}
                      className="flex items-center gap-1 text-xs text-white/45 transition-colors hover:text-white"
                    >
                      <ChevronRight className="h-3 w-3" />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6">
            <p className="text-[11px] text-white/25">
              © {new Date().getFullYear()} Geo Properties Kenya Ltd. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-[11px] text-white/25">
                <Lock className="h-3 w-3" /> Secure & encrypted
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-white/25">
                <Zap className="h-3 w-3" /> Real-time data
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-white/25">
                <Building2 className="h-3 w-3" /> Nairobi, Kenya
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-wider text-white/50">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold text-white drop-shadow">{value}</dd>
    </div>
  );
}
