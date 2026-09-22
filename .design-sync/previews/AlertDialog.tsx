import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "land-eye-kenya-frontend";

export const DeleteListing = () => (
  <AlertDialog open>
    <AlertDialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
      <AlertDialogHeader>
        <AlertDialogTitle>Delete this listing?</AlertDialogTitle>
        <AlertDialogDescription>
          This can't be undone. The listing and its photos will be removed.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
          Delete
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);
