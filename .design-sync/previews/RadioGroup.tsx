import { Label, RadioGroup, RadioGroupItem } from "land-eye-kenya-frontend";

export const ListingType = () => (
  <RadioGroup defaultValue="sale" className="grid gap-3">
    {[
      ["sale", "For sale"],
      ["lease", "For lease"],
      ["rent", "For rent"],
    ].map(([v, l]) => (
      <div key={v} className="flex items-center gap-2">
        <RadioGroupItem value={v} id={`r-${v}`} />
        <Label htmlFor={`r-${v}`}>{l}</Label>
      </div>
    ))}
  </RadioGroup>
);

export const Horizontal = () => (
  <RadioGroup defaultValue="owner" className="flex gap-6">
    <div className="flex items-center gap-2">
      <RadioGroupItem value="owner" id="p-owner" />
      <Label htmlFor="p-owner">Owner</Label>
    </div>
    <div className="flex items-center gap-2">
      <RadioGroupItem value="broker" id="p-broker" />
      <Label htmlFor="p-broker">Broker</Label>
    </div>
  </RadioGroup>
);
