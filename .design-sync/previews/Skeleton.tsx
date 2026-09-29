import { Skeleton } from "land-eye-kenya-frontend";

export const ListingCardLoading = () => (
  <div className="w-80 rounded-xl border border-border bg-card p-4">
    <Skeleton className="h-36 w-full" />
    <Skeleton className="mt-4 h-4 w-3/4" />
    <Skeleton className="mt-2 h-3 w-1/2" />
    <Skeleton className="mt-4 h-6 w-1/3" />
  </div>
);

export const RowLoading = () => (
  <div className="flex w-80 items-center gap-3">
    <Skeleton className="h-10 w-10 rounded-full" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-3 w-1/3" />
    </div>
  </div>
);
