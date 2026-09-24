import {
  Button,
  Input,
  Label,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "land-eye-kenya-frontend";

export const EditProfile = () => (
  <Sheet open>
    <SheetContent onOpenAutoFocus={(e) => e.preventDefault()}>
      <SheetHeader>
        <SheetTitle>Edit profile</SheetTitle>
        <SheetDescription>Buyers see your name and agency on every listing.</SheetDescription>
      </SheetHeader>
      <div className="grid gap-3 py-4">
        <div className="grid gap-1.5">
          <Label htmlFor="n">Full name</Label>
          <Input id="n" defaultValue="James Otieno" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="a">Agency</Label>
          <Input id="a" defaultValue="Rift Realty" />
        </div>
      </div>
      <SheetFooter>
        <Button>Save changes</Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
);
