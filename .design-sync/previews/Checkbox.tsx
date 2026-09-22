import { Checkbox, Label } from "land-eye-kenya-frontend";

export const States = () => (
  <div className="grid gap-3">
    <div className="flex items-center gap-2">
      <Checkbox id="c1" defaultChecked />
      <Label htmlFor="c1">Water connection</Label>
    </div>
    <div className="flex items-center gap-2">
      <Checkbox id="c2" />
      <Label htmlFor="c2">Electricity</Label>
    </div>
    <div className="flex items-center gap-2">
      <Checkbox id="c3" disabled />
      <Label htmlFor="c3" className="opacity-50">Borehole (not available)</Label>
    </div>
  </div>
);

export const WithDescription = () => (
  <div className="flex w-80 items-start gap-2">
    <Checkbox id="alerts" defaultChecked className="mt-0.5" />
    <div className="grid gap-1">
      <Label htmlFor="alerts">Email me new listings</Label>
      <p className="text-sm text-muted-foreground">
        We'll send a weekly digest of verified parcels matching your saved search.
      </p>
    </div>
  </div>
);
