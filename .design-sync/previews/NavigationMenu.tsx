import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "land-eye-kenya-frontend";

export const MainNav = () => (
  <div className="h-64 w-[36rem]">
    <NavigationMenu value="explore">
      <NavigationMenuList>
        <NavigationMenuItem value="explore">
          <NavigationMenuTrigger>Explore</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-96 grid-cols-2 gap-2 p-3">
              {[
                ["Land", "Verified parcels on the map"],
                ["Rentals", "Homes, BnBs and offices"],
                ["Blog", "Guides & industry news"],
                ["Help Centre", "FAQs and support"],
              ].map(([t, d]) => (
                <li key={t}>
                  <NavigationMenuLink className="block rounded-md p-2 hover:bg-muted" href="#">
                    <p className="text-sm font-medium text-foreground">{t}</p>
                    <p className="text-xs text-muted-foreground">{d}</p>
                  </NavigationMenuLink>
                </li>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink className="px-4 py-2 text-sm font-medium" href="#">
            Pricing
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  </div>
);
