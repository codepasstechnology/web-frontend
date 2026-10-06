const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const KENYAN_MOBILE = /^[17]\d{8}$/;

export function isValidEmail(value: string): boolean {
  return EMAIL.test(value.trim());
}

/** The nine digits of a Kenyan mobile number, or null when the number is not valid. */
export function kenyanMobileDigits(value: string): string | null {
  const digits = value
    .replace(/\s/g, "")
    .replace(/^\+?254/, "")
    .replace(/^0/, "");
  return KENYAN_MOBILE.test(digits) ? digits : null;
}

export const PASSWORD_LABELS = [
  "",
  "Weak: add numbers or capitals",
  "Okay: getting there",
  "Good password",
  "Strong password",
] as const;

/** 0 when empty, otherwise 1–4: length, a digit, both cases, and a symbol or length of 12+. */
export function passwordScore(pw: string): number {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw) || pw.length >= 12) score++;
  return Math.max(1, score);
}
