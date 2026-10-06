import { describe, it, expect } from "vitest";
import { isValidEmail, kenyanMobileDigits, passwordScore } from "@/components/auth/validation";

describe("isValidEmail", () => {
  it("accepts an address with a domain and rejects everything else", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
    expect(isValidEmail("  user@example.com ")).toBe(true);
    expect(isValidEmail("user@example")).toBe(false);
    expect(isValidEmail("user example@mail.com")).toBe(false);
  });
});

describe("kenyanMobileDigits", () => {
  it("accepts the common ways of writing a Kenyan mobile number", () => {
    expect(kenyanMobileDigits("712 345 678")).toBe("712345678");
    expect(kenyanMobileDigits("0712345678")).toBe("712345678");
    expect(kenyanMobileDigits("+254 712 345 678")).toBe("712345678");
    expect(kenyanMobileDigits("254112345678")).toBe("112345678");
  });

  it("rejects numbers that are not nine digits starting with 1 or 7", () => {
    expect(kenyanMobileDigits("812345678")).toBeNull();
    expect(kenyanMobileDigits("71234567")).toBeNull();
    expect(kenyanMobileDigits("")).toBeNull();
  });
});

describe("passwordScore", () => {
  it("scores 0 when empty and at least 1 once typing starts", () => {
    expect(passwordScore("")).toBe(0);
    expect(passwordScore("a")).toBe(1);
  });

  it("adds a point each for length, a digit, both cases, and a symbol or length of 12", () => {
    expect(passwordScore("abcdefgh")).toBe(1);
    expect(passwordScore("abcdefg1")).toBe(2);
    expect(passwordScore("Abcdefg1")).toBe(3);
    expect(passwordScore("Abcdefg1!")).toBe(4);
    expect(passwordScore("abcdefghijkl")).toBe(2);
  });
});
