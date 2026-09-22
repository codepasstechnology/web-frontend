import { Label, Slider } from "land-eye-kenya-frontend";

export const PriceRange = () => (
  <div className="grid w-80 gap-3">
    <div className="flex justify-between text-sm">
      <Label>Max price</Label>
      <span className="font-medium text-foreground">KES 12,000,000</span>
    </div>
    <Slider defaultValue={[40]} max={100} step={1} />
  </div>
);

