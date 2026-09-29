import { Link } from "@tanstack/react-router";
import { LogoMark } from "@/components/ui/logo";

const upload = { to: "/dashboard/upload", search: { edit: undefined, type: undefined } } as const;

export function SiteFooter() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="mx-auto flex max-w-[1100px] flex-col gap-12 px-4 pb-6 pt-12 md:px-8 md:pb-8 md:pt-16">
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))]">
          <div className="col-span-2 flex flex-col gap-3.5 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <LogoMark aria-hidden className="h-9" />
              <span className="text-lg font-bold">Geo Pin Properties</span>
            </div>
            <p className="max-w-[32ch] text-sm leading-relaxed opacity-80">
              Verified land and homes across Kenya&apos;s 47 counties.
            </p>
          </div>
          <nav aria-label="Marketplace" className="flex flex-col gap-2.5 text-sm">
            <span className="font-bold">Marketplace</span>
            <Link to="/land" className="opacity-80 hover:opacity-100">
              Land map
            </Link>
            <Link to="/rentals" className="opacity-80 hover:opacity-100">
              Rentals &amp; homes
            </Link>
            <Link {...upload} className="opacity-80 hover:opacity-100">
              List a property
            </Link>
          </nav>
          <nav aria-label="Company" className="flex flex-col gap-2.5 text-sm">
            <span className="font-bold">Company</span>
            <Link to="/about" className="opacity-80 hover:opacity-100">
              About
            </Link>
            <Link to="/pricing" className="opacity-80 hover:opacity-100">
              Pricing
            </Link>
            <Link to="/blog" className="opacity-80 hover:opacity-100">
              Guides
            </Link>
          </nav>
          <nav aria-label="Support" className="flex flex-col gap-2.5 text-sm">
            <span className="font-bold">Support</span>
            <Link to="/help" className="opacity-80 hover:opacity-100">
              Help centre
            </Link>
            <Link to="/contact" className="opacity-80 hover:opacity-100">
              Contact
            </Link>
            <Link to="/terms" className="opacity-80 hover:opacity-100">
              Terms &amp; privacy
            </Link>
          </nav>
        </div>
        <div className="border-t border-white/15 pt-6 text-[0.8125rem] opacity-80">
          © {new Date().getFullYear()} Geo Pin Properties. Nairobi, Kenya.
        </div>
      </div>
    </footer>
  );
}
