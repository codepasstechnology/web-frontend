import { MapPinned } from "lucide-react";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: { pin: "h-4 w-4", ring: "h-1.5 w-1.5" },
  md: { pin: "h-6 w-6", ring: "h-2 w-2" },
  lg: { pin: "h-10 w-10", ring: "h-3 w-3" },
} as const;

interface SpinnerProps {
  size?: keyof typeof SIZES;
  className?: string;
  label?: string;
}

// A dropping pin with a fading "locating…" ring underneath — the same
// motif map apps use for "finding your location", which reads as loading
// on a GIS product far better than a generic spinning ring.
export function Spinner({ size = "md", className, label = "Loading…" }: SpinnerProps) {
  const s = SIZES[size];
  return (
    <span
      role="status"
      className={cn("relative inline-flex items-center justify-center", className)}
    >
      <span className={cn(s.ring, "lv-spinner-ring absolute bottom-0 rounded-full bg-current")} />
      <MapPinned className={cn(s.pin, "lv-spinner-pin relative text-current")} />
      <span className="sr-only">{label}</span>
    </span>
  );
}
