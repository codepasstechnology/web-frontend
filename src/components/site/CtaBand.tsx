import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function CtaBand() {
  return (
    <section aria-labelledby="cta-title" className="mt-20 bg-brand md:mt-[120px]">
      <div className="mx-auto flex max-w-[1100px] flex-col items-center gap-6 px-4 py-16 text-center md:px-8 md:py-[88px]">
        <h2
          id="cta-title"
          className="text-[clamp(2rem,5vw,3.25rem)] font-extrabold leading-[1.05] tracking-[-0.025em] text-white"
        >
          Find. Connect. Own.
        </h2>
        <p className="max-w-[48ch] text-[1.0625rem] leading-relaxed text-white">
          Verified land and homes across Kenya, pinned to their real locations.
        </p>
        <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row">
          <Button
            asChild
            size="lg"
            className="h-11 bg-white px-6 text-base text-primary hover:bg-white/90"
          >
            <Link to="/explore">Explore the map</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-11 border-white/70 bg-transparent px-6 text-base text-white hover:bg-white/10 hover:text-white"
          >
            <Link to="/dashboard/upload" search={{ edit: undefined, type: undefined }}>
              List your property
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
