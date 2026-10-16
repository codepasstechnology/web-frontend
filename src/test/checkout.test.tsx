import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Plan } from "@/lib/plans";

const mockStart = vi.fn(() => Promise.resolve({ invoiceId: "inv-1" }));

vi.mock("@/lib/auth", () => ({
  useAuth: () => ({
    startPlanCheckout: mockStart,
    startCardCheckout: vi.fn(),
    previewPlanChange: () => Promise.resolve({ credited_days: 0 }),
    getInvoiceStatus: vi.fn(),
    reloadUser: vi.fn(),
    cancelInvoice: vi.fn(),
  }),
}));

const { CheckoutModal } = await import("@/components/CheckoutModal");

const pro: Plan = {
  id: "pro",
  name: "Pro",
  price: 4500,
  priceYearly: 40500,
  listings: 50,
  photos: 20,
  documents: 10,
  cta: "Choose Pro",
  features: [],
};

describe("CheckoutModal — M-Pesa phone", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects a number that isn't a Kenyan mobile and sends nothing", async () => {
    render(<CheckoutModal plan={pro} onClose={vi.fn()} />);

    await userEvent.type(screen.getByLabelText("M-Pesa phone number"), "12345");
    await userEvent.click(screen.getByRole("button", { name: "Pay KES 4,500" }));

    expect(
      screen.getByText("Enter a Kenyan mobile number, like 0712 345 678."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("M-Pesa phone number")).toHaveAttribute("aria-invalid", "true");
    expect(mockStart).not.toHaveBeenCalled();
  });

  it("sends a valid number without its spaces", async () => {
    render(<CheckoutModal plan={pro} onClose={vi.fn()} />);

    await userEvent.type(screen.getByLabelText("M-Pesa phone number"), "0712 345 678");
    await userEvent.click(screen.getByRole("button", { name: "Pay KES 4,500" }));

    expect(mockStart).toHaveBeenCalledWith("pro", "monthly", "0712345678");
    expect(await screen.findByText("Check your phone")).toBeInTheDocument();
  });
});
