import { useQuery } from "@tanstack/react-query";
import { api } from "./api";

export function usePublicSettings() {
  return useQuery({
    queryKey: ["public-settings"],
    queryFn: () => api.get<Record<string, string>>("/public/settings"),
    staleTime: 5 * 60_000,
  });
}

/**
 * Open unless the platform explicitly says otherwise — while the query is
 * loading, on error, or against a backend without the endpoint, registration
 * stays available rather than locking everyone out.
 */
export function useSignupsOpen(): boolean {
  const { data } = usePublicSettings();

  return data?.open_signups !== "false";
}
