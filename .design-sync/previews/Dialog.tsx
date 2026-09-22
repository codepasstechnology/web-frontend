import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from "land-eye-kenya-frontend";

export const ConfirmAction = () => (
  <Dialog open>
    <DialogContent className="sm:max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
      <DialogHeader>
        <DialogTitle>Mark this listing as sold?</DialogTitle>
        <DialogDescription>
          It will be removed from the marketplace and buyers can no longer see it.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline">Cancel</Button>
        <Button>Mark as sold</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export const FormDialog = () => (
  <Dialog open>
    <DialogContent className="sm:max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
      <DialogHeader>
        <DialogTitle>Contact the seller</DialogTitle>
        <DialogDescription>Your number is shared only with this seller.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" defaultValue="Wanjiku Kamau" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" placeholder="07XX XXX XXX" />
        </div>
      </div>
      <DialogFooter>
        <Button className="bg-brand text-brand-foreground hover:bg-brand/90">Send enquiry</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
