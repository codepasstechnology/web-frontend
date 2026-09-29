import { Alert, AlertDescription, AlertTitle } from "land-eye-kenya-frontend";
import { AlertTriangle, Info } from "lucide-react";

export const Default = () => (
  <Alert className="w-96">
    <Info className="h-4 w-4" />
    <AlertTitle>Verification in progress</AlertTitle>
    <AlertDescription>
      We're checking the title with the land registry. This usually takes 2–3 working days.
    </AlertDescription>
  </Alert>
);

export const Destructive = () => (
  <Alert variant="destructive" className="w-96">
    <AlertTriangle className="h-4 w-4" />
    <AlertTitle>Boundary dispute reported</AlertTitle>
    <AlertDescription>
      A neighbouring owner has flagged this parcel. Listing is paused until it's resolved.
    </AlertDescription>
  </Alert>
);
