import { X } from "lucide-react";
import { plans, type PlanId } from "@/lib/plans";
import { PlanCard } from "./PlanCard";

interface Props {
  open: boolean;
  currentPlan: PlanId;
  onClose: () => void;
  onSelect: (id: PlanId) => void;
  reason?: string;
}

export function UpgradeModal({ open, currentPlan, onClose, onSelect, reason }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 p-4">
      <div className="relative w-full max-w-5xl rounded-lg border border-border bg-background p-6 shadow-lg">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1.5 text-muted-foreground hover:bg-muted"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
        <h2 className="text-xl font-semibold text-foreground">Upgrade your plan</h2>
        {reason && <p className="mt-1 text-sm text-muted-foreground">{reason}</p>}
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {plans.map((p) => (
            <PlanCard
              key={p.id}
              plan={p}
              current={p.id === currentPlan}
              onSelect={() => {
                onSelect(p.id);
                onClose();
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}