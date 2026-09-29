import { ScrollArea, Separator } from "land-eye-kenya-frontend";

const counties = [
  "Baringo",
  "Bomet",
  "Bungoma",
  "Busia",
  "Embu",
  "Garissa",
  "Homa Bay",
  "Isiolo",
  "Kajiado",
  "Kakamega",
  "Kericho",
  "Kiambu",
  "Kilifi",
  "Kirinyaga",
  "Kisii",
  "Kisumu",
];

export const CountyList = () => (
  <ScrollArea className="h-56 w-56 rounded-md border border-border">
    <div className="p-4">
      <p className="mb-3 text-sm font-semibold text-foreground">Counties</p>
      {counties.map((c) => (
        <div key={c}>
          <div className="text-sm text-foreground">{c}</div>
          <Separator className="my-2" />
        </div>
      ))}
    </div>
  </ScrollArea>
);
