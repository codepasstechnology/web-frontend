import { Button, Collapsible, CollapsibleContent, CollapsibleTrigger } from "land-eye-kenya-frontend";
import { ChevronsUpDown } from "lucide-react";

export const Amenities = () => (
  <Collapsible open className="w-80 space-y-2">
    <div className="flex items-center justify-between">
      <p className="text-sm font-semibold text-foreground">Nearby amenities</p>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm">
          <ChevronsUpDown />
        </Button>
      </CollapsibleTrigger>
    </div>
    <div className="rounded-md border border-border px-4 py-2 text-sm">School · 1.2 km</div>
    <CollapsibleContent className="space-y-2">
      <div className="rounded-md border border-border px-4 py-2 text-sm">Hospital · 3.5 km</div>
      <div className="rounded-md border border-border px-4 py-2 text-sm">Shopping centre · 2 km</div>
    </CollapsibleContent>
  </Collapsible>
);
