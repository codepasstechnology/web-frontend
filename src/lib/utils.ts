import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Drops a decimal fraction before stripping separators. Absorbing it instead
 * would turn a pasted "8,500,000.00" into 850000000 — a silent hundredfold
 * error on a field that only ever holds whole shillings.
 */
export function toDigits(value: string, maxLength = 12): string {
  return value.split(".")[0].replace(/\D/g, "").slice(0, maxLength);
}

/**
 * The locale is pinned: on a browser set to de-DE, toLocaleString() would
 * render a shilling amount as "8.500.000", where the dot reads as a decimal
 * point to a Kenyan seller.
 */
export function formatThousands(digits: string): string {
  return digits ? Number(digits).toLocaleString("en-US") : "";
}
