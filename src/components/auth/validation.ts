const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const KENYAN_MOBILE = /^[17]\d{8}$/;
// Same ranges as the backend PlainText rule, so the form and the API agree.
// The variation selector and zero-width joiner combine with the previous
// character, so they sit outside the class (no-misleading-character-class).
const EMOJI =
  /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2300}-\u{23FF}\u{2B00}-\u{2BFF}\u{E0020}-\u{E007F}]|\u{FE0F}|\u{200D}/u;
const TAG = /<\s*[a-z/!?]/i;

/** Why free text would be refused by the API, or "" when it is fine. */
export function plainTextError(value: string): string {
  if (TAG.test(value)) return "Remove HTML or script tags.";
  if (EMOJI.test(value)) return "Remove emoji.";
  return "";
}

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
