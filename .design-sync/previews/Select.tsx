import {
  Label,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "land-eye-kenya-frontend";

const counties = ["Nairobi", "Kiambu", "Kajiado", "Machakos", "Nakuru"];

export const Open = () => (
  <div className="grid w-64 gap-1.5">
    <Label>County</Label>
    <Select defaultValue="Kajiado" open>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Counties</SelectLabel>
          {counties.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  </div>
);

export const Closed = () => (
  <div className="grid w-64 gap-1.5">
    <Label>Listing type</Label>
    <Select>
      <SelectTrigger>
        <SelectValue placeholder="Any type" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="sale">For sale</SelectItem>
        <SelectItem value="lease">For lease</SelectItem>
      </SelectContent>
    </Select>
  </div>
);
