import { useRef, useState } from "react";
import { clearRecent, pushRecent, readRecent } from "@/lib/recentlyViewed";

export function useRecentlyViewed() {
  const [ids, setIds] = useState<string[]>(() => readRecent());
  return {
    ids,
    push: (id: string) => setIds((list) => pushRecent(list, id)),
    clear: () => {
      clearRecent();
      setIds([]);
    },
  };
}

/**
 * Every listing this visit has loaded, by id. Visible-area loading swaps the
 * list as the map moves, but an open panel, a compared plot or a recently
 * viewed chip must still resolve after its listing has scrolled out of view.
 */
export function useKnownListings<T extends { id: string }>(list: T[]): Map<string, T> {
  const known = useRef(new Map<string, T>());
  for (const item of list) known.current.set(item.id, item);
  return known.current;
}
