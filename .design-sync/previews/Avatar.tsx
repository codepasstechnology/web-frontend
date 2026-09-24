import { Avatar, AvatarFallback, AvatarImage } from "land-eye-kenya-frontend";

export const Initials = () => (
  <div className="flex items-center gap-3">
    <Avatar>
      <AvatarImage src="" alt="Wanjiku Kamau" />
      <AvatarFallback>WK</AvatarFallback>
    </Avatar>
    <Avatar>
      <AvatarFallback className="bg-brand text-brand-foreground">JO</AvatarFallback>
    </Avatar>
    <Avatar className="h-12 w-12">
      <AvatarFallback className="bg-primary text-primary-foreground">AM</AvatarFallback>
    </Avatar>
  </div>
);

export const SellerRow = () => (
  <div className="flex items-center gap-3">
    <Avatar>
      <AvatarFallback>JO</AvatarFallback>
    </Avatar>
    <div>
      <p className="text-sm font-medium text-foreground">James Otieno</p>
      <p className="text-xs text-muted-foreground">Broker · Rift Realty</p>
    </div>
  </div>
);
