import {
  Avatar,
  AvatarFallback,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "land-eye-kenya-frontend";

export const SellerPreview = () => (
  <div className="h-48 w-80">
    <HoverCard open>
      <HoverCardTrigger className="text-sm font-medium text-brand underline-offset-4 hover:underline">
        @rift-realty
      </HoverCardTrigger>
      <HoverCardContent align="start" className="w-72">
        <div className="flex gap-3">
          <Avatar>
            <AvatarFallback>RR</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold text-foreground">Rift Realty</p>
            <p className="text-sm text-muted-foreground">Verified broker · 42 active listings</p>
            <p className="mt-1 text-xs text-muted-foreground">Member since March 2024</p>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  </div>
);
