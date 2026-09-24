import { describe, it, expect } from "vitest";
import { formatThousands, toDigits } from "@/lib/utils";

describe("toDigits", () => {
  it("strips the separators its own formatter adds", () => {
    expect(toDigits("8,500,000")).toBe("8500000");
  });

  it("strips anything a paste might carry in", () => {
    expect(toDigits("KES 8,500,000")).toBe("8500000");
    expect(toDigits("Ksh 75 000")).toBe("75000");
  });

  it("drops a pasted decimal fraction instead of absorbing it", () => {
    expect(toDigits("8,500,000.00")).toBe("8500000");
    expect(toDigits("1234.99")).toBe("1234");
  });

  it("returns an empty string when there is nothing numeric", () => {
    expect(toDigits("")).toBe("");
    expect(toDigits("abc")).toBe("");
  });

  it("caps the length so a stray paste cannot overflow the column", () => {
    expect(toDigits("1234567890123456")).toBe("123456789012");
    expect(toDigits("123456", 3)).toBe("123");
  });
});

describe("formatThousands", () => {
  it("groups from the right", () => {
    expect(formatThousands("8500000")).toBe("8,500,000");
    expect(formatThousands("75000")).toBe("75,000");
  });

  it("leaves short values ungrouped", () => {
    expect(formatThousands("0")).toBe("0");
    expect(formatThousands("999")).toBe("999");
  });

  it("collapses leading zeros", () => {
    expect(formatThousands("0075000")).toBe("75,000");
  });

  it("renders an empty field rather than a zero", () => {
    expect(formatThousands("")).toBe("");
  });

  /**
   * The input re-parses its own displayed value on every keystroke, so the two
   * helpers have to compose back to the stored digits.
   */
  it("round-trips through toDigits", () => {
    for (const digits of ["0", "999", "75000", "8500000", "123456789012"]) {
      expect(toDigits(formatThousands(digits))).toBe(digits);
    }
  });
});
