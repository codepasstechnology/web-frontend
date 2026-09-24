import { Checkbox, Input, Label } from "land-eye-kenya-frontend";

export const ForInput = () => (
  <div className="grid w-64 gap-1.5">
    <Label htmlFor="county">County</Label>
    <Input id="county" defaultValue="Kiambu" />
  </div>
);

export const ForCheckbox = () => (
  <div className="flex items-center gap-2">
    <Checkbox id="terms" defaultChecked />
    <Label htmlFor="terms">I confirm I own this parcel</Label>
  </div>
);
