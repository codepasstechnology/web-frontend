import { Tabs, TabsContent, TabsList, TabsTrigger } from "land-eye-kenya-frontend";

export const ParcelDetails = () => (
  <Tabs defaultValue="overview" className="w-96">
    <TabsList>
      <TabsTrigger value="overview">Overview</TabsTrigger>
      <TabsTrigger value="amenities">Amenities</TabsTrigger>
      <TabsTrigger value="documents">Documents</TabsTrigger>
    </TabsList>
    <TabsContent value="overview" className="text-sm text-muted-foreground">
      50 × 100 ft plot on a gentle slope, 400 m from the Namanga road. Water and power on site.
    </TabsContent>
  </Tabs>
);

export const FullWidth = () => (
  <Tabs defaultValue="land" className="w-80">
    <TabsList className="grid w-full grid-cols-2">
      <TabsTrigger value="land">Land</TabsTrigger>
      <TabsTrigger value="rentals">Rentals</TabsTrigger>
    </TabsList>
  </Tabs>
);
