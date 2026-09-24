import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "land-eye-kenya-frontend";
import { ShieldCheck } from "lucide-react";

export const VerifiedHint = () => (
  <div className="flex h-28 w-64 items-end justify-center">
    <TooltipProvider>
      <Tooltip open>
        <TooltipTrigger asChild>
          <Button variant="outline" size="icon" aria-label="Verified">
            <ShieldCheck />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Title verified with the land registry</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
);
