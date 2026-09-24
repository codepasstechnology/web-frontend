import {
  Button,
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "land-eye-kenya-frontend";

export const MobileFilters = () => (
  <Drawer open shouldScaleBackground={false}>
    <DrawerContent>
      <DrawerHeader>
        <DrawerTitle>Filter parcels</DrawerTitle>
        <DrawerDescription>Showing 128 verified parcels in Kajiado.</DrawerDescription>
      </DrawerHeader>
      <DrawerFooter>
        <Button className="bg-brand text-brand-foreground hover:bg-brand/90">Show results</Button>
        <Button variant="outline">Reset</Button>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>
);
