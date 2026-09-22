import { Button, Input, Label, Popover, PopoverContent, PopoverTrigger } from "land-eye-kenya-frontend";

export const PriceFilter = () => (
  <div className="h-64 w-80">
    <Popover open>
      <PopoverTrigger asChild>
        <Button variant="outline">Price</Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72" onOpenAutoFocus={(e) => e.preventDefault()}>
        <div className="grid gap-3">
          <p className="text-sm font-semibold text-foreground">Price range (KES)</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-1">
              <Label htmlFor="min">Min</Label>
              <Input id="min" defaultValue="500,000" />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="max">Max</Label>
              <Input id="max" defaultValue="5,000,000" />
            </div>
          </div>
          <Button size="sm">Apply</Button>
        </div>
      </PopoverContent>
    </Popover>
  </div>
);
