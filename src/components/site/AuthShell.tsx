import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/ui/logo";

/** Full-screen photo backdrop with the logo, a way home, and a centered form card. */
export function AuthShell({
  image,
  wide = false,
  below,
  children,
}: {
  image: string;
  wide?: boolean;
  below?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-4 py-24">
      <img
        src={image}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover object-center"
        fetchPriority="high"
        draggable={false}
      />
      <div className="absolute inset-0 bg-black/60" />

      <Link
        to="/"
        className="absolute left-5 top-5 z-20 flex items-center gap-2.5 sm:left-8 sm:top-8"
      >
        <LogoMark aria-hidden className="h-9" />
        <span className="text-base font-semibold tracking-tight text-white">
          Geo Pin Properties
        </span>
      </Link>

      <Button
        asChild
        variant="outline"
        size="sm"
        className="absolute right-5 top-5 z-20 border-white/25 bg-black/40 text-white hover:bg-black/60 hover:text-white sm:right-8 sm:top-8"
      >
        <Link to="/">
          <ArrowLeft /> Home
        </Link>
      </Button>

      <div className={`relative z-10 w-full ${wide ? "max-w-[480px]" : "max-w-[400px]"}`}>
        <div className="rounded-xl border border-border bg-card px-6 py-8 text-card-foreground shadow-lg sm:px-8">
          {children}
        </div>
        {below}
      </div>
    </div>
  );
}

export function AuthTerms({ action }: { action: string }) {
  return (
    <p className="mt-5 text-center text-xs text-white/70">
      By {action} you agree to our{" "}
      <Link to="/terms" className="underline underline-offset-2 hover:text-white">
        Terms of Service
      </Link>{" "}
      and{" "}
      <Link to="/privacy" className="underline underline-offset-2 hover:text-white">
        Privacy Policy
      </Link>
      .
    </p>
  );
}
