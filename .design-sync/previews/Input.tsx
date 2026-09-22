import { Input, Label } from "land-eye-kenya-frontend";

export const WithLabel = () => (
  <div className="grid w-72 gap-1.5">
    <Label htmlFor="parcel">Parcel number</Label>
    <Input id="parcel" placeholder="e.g. KAJ/KTG/4521" />
  </div>
);

export const Filled = () => (
  <div className="grid w-72 gap-1.5">
    <Label htmlFor="price">Asking price (KES)</Label>
    <Input id="price" type="text" defaultValue="1,850,000" />
  </div>
);

export const Invalid = () => (
  <div className="grid w-72 gap-1.5">
    <Label htmlFor="email">Email</Label>
    <Input id="email" aria-invalid defaultValue="wanjiku@" className="border-destructive" />
    <p className="text-xs text-destructive">Enter a valid email address.</p>
  </div>
);

export const Disabled = () => (
  <Input className="w-72" disabled defaultValue="Kajiado County" />
);
