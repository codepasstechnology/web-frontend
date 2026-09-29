import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "land-eye-kenya-frontend";
import { MapPin, Plus, Search } from "lucide-react";

export const QuickSearch = () => (
  <Command className="w-96 rounded-lg border border-border shadow-md">
    <CommandInput placeholder="Search parcel, county…" />
    <CommandList>
      <CommandEmpty>No results found.</CommandEmpty>
      <CommandGroup heading="Counties">
        <CommandItem>
          <MapPin /> Kajiado
        </CommandItem>
        <CommandItem>
          <MapPin /> Kiambu
        </CommandItem>
      </CommandGroup>
      <CommandSeparator />
      <CommandGroup heading="Actions">
        <CommandItem>
          <Plus /> New listing <CommandShortcut>⌘N</CommandShortcut>
        </CommandItem>
        <CommandItem>
          <Search /> Saved searches
        </CommandItem>
      </CommandGroup>
    </CommandList>
  </Command>
);
