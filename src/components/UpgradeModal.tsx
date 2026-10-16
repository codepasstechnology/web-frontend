import { X } from "lucide-react";
import { usePlans } from "@/lib/plans";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { PlanCard } from "./PlanCard";

interface Props {
  open: boolean;
  currentPlan: string;
  onClose: () => void;
  onSelect: (id: string) => void;
  reason?: string;
}

export function UpgradeModal({ open, currentPlan, onClose, onSelect, reason }: Props) {
  const { data: plans = [] } = usePlans();
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="gd-dialog gd-xwide [&>button:last-child]:hidden">
        <div className="flex items-start justify-between gap-3">
          <div>
            <DialogTitle className="gd-h1 text-[28px]">Upgrade your plan</DialogTitle>
            {reason ? (
              <DialogDescription className="gd-sub">{reason}</DialogDescription>
            ) : (
              <DialogDescription className="sr-only">
                Compare plans and choose the one that fits.
              </DialogDescription>
            )}
          </div>
          <button type="button" className="gd-ib" onClick={onClose} aria-label="Close">
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="grid gap-3.5 pt-2.5 [grid-template-columns:repeat(auto-fit,minmax(210px,1fr))]">
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
      </DialogContent>
    </Dialog>
  );
}
