import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "land-eye-kenya-frontend";

export const ListingCard = () => (
  <Card className="w-80">
    <CardHeader>
      <div className="flex items-start justify-between gap-2">
        <CardTitle>Kitengela Prime Plot</CardTitle>
        <Badge className="bg-success/10 text-success border-transparent">Verified</Badge>
      </div>
      <CardDescription>KAJ/KTG/4521 · Kajiado County · 50 × 100 ft</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-2xl font-semibold text-foreground">KES 1,850,000</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Gentle slope, 400 m to tarmac, water and power on site. Title deed ready for transfer.
      </p>
    </CardContent>
    <CardFooter className="gap-2">
      <Button className="flex-1">Contact seller</Button>
      <Button variant="outline">Save</Button>
    </CardFooter>
  </Card>
);

export const StatCard = () => (
  <div className="grid w-[28rem] grid-cols-3 gap-3">
    {[
      ["Active listings", "12"],
      ["Views (30d)", "4,281"],
      ["Enquiries", "37"],
    ].map(([label, value]) => (
      <Card key={label}>
        <CardHeader className="p-4">
          <CardDescription className="text-xs">{label}</CardDescription>
          <CardTitle className="text-2xl">{value}</CardTitle>
        </CardHeader>
      </Card>
    ))}
  </div>
);

export const Simple = () => (
  <Card className="w-80">
    <CardHeader>
      <CardTitle>Upgrade to Agent</CardTitle>
      <CardDescription>List up to 50 parcels and unlock analytics.</CardDescription>
    </CardHeader>
    <CardFooter>
      <Button className="w-full bg-brand text-brand-foreground hover:bg-brand/90">
        See plans
      </Button>
    </CardFooter>
  </Card>
);
