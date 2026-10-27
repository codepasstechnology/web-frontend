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

export type PaymentMethod = "mpesa" | "card";

/** The checkout methods admins have left on; both stay offered until settings load. */
export function usePaymentMethods(): PaymentMethod[] {
  const { data } = usePublicSettings();

  return (["mpesa", "card"] as const).filter((m) => data?.[`${m}_payments_enabled`] !== "false");
}

/**
 * The method a checkout should use: the one the user picked while it stays
 * enabled, otherwise the first one still on. `null` when admins turned off both.
 */
export function useCheckoutMethod(chosen: PaymentMethod): PaymentMethod | null {
  const methods = usePaymentMethods();

  return methods.includes(chosen) ? chosen : (methods[0] ?? null);
}
