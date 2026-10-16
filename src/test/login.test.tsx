import React from "react";
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginPage } from "../routes/login";

beforeAll(() => {
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
  })) as unknown as typeof window.matchMedia;
});

const mockNavigate = vi.fn();
const mockLogin = vi.fn();
const mockVerifyTwoFactor = vi.fn();
const mockResendTwoFactorCode = vi.fn();

const authenticated = { status: "authenticated", user: { id: "1", role: "individual" } };

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (opts: unknown) => opts,
  useNavigate: () => mockNavigate,
  Link: ({
    to,
    children,
    ...props
  }: {
    to: string;
    children: React.ReactNode;
    [k: string]: unknown;
  }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/auth", () => ({
  useAuth: () => ({
    login: mockLogin,
    verifyTwoFactor: mockVerifyTwoFactor,
    resendTwoFactorCode: mockResendTwoFactorCode,
  }),
}));

describe("LoginPage", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockLogin.mockReset();
    mockVerifyTwoFactor.mockReset();
    mockResendTwoFactorCode.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders email and password inputs", () => {
    render(<LoginPage />);
    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Your password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("shows error when email is empty", async () => {
    render(<LoginPage />);
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));
    expect(screen.getByText("Enter your email address.")).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("shows error when password is empty", async () => {
    render(<LoginPage />);
    await userEvent.type(screen.getByPlaceholderText("you@example.com"), "user@example.com");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));
    expect(screen.getByText("Enter your password.")).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("calls login() with the entered email and password", async () => {
    mockLogin.mockResolvedValue(authenticated);
    render(<LoginPage />);
    await userEvent.type(screen.getByPlaceholderText("you@example.com"), "user@example.com");
    await userEvent.type(screen.getByPlaceholderText("Your password"), "password123");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));
    expect(mockLogin).toHaveBeenCalledWith("user@example.com", "password123", true);
  });

  it("shows the API error message on login failure", async () => {
    mockLogin.mockRejectedValue({ errors: { email: ["Invalid credentials."] } });
    render(<LoginPage />);
    await userEvent.type(screen.getByPlaceholderText("you@example.com"), "user@example.com");
    await userEvent.type(screen.getByPlaceholderText("Your password"), "wrongpass");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => expect(screen.getByText("Invalid credentials.")).toBeInTheDocument());
  });

  it("falls back to message when errors object is absent", async () => {
    mockLogin.mockRejectedValue({ message: "Account is locked." });
    render(<LoginPage />);
    await userEvent.type(screen.getByPlaceholderText("you@example.com"), "user@example.com");
    await userEvent.type(screen.getByPlaceholderText("Your password"), "pass");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => expect(screen.getByText("Account is locked.")).toBeInTheDocument());
  });

  it("shows success state after successful login", async () => {
    mockLogin.mockResolvedValue(authenticated);
    render(<LoginPage />);
    await userEvent.type(screen.getByPlaceholderText("you@example.com"), "user@example.com");
    await userEvent.type(screen.getByPlaceholderText("Your password"), "password123");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));
    // Success UI renders immediately; the 1500ms navigation timer fires after the test
    await waitFor(() =>
      expect(screen.getByText(/Taking you to your dashboard/)).toBeInTheDocument(),
    );
  });

  it("shows the code screen instead of signing in when two-factor is required", async () => {
    mockLogin.mockResolvedValue({
      status: "two_factor_required",
      challenge: "enc_challenge",
      email: "user@example.com",
    });
    render(<LoginPage />);
    await userEvent.type(screen.getByPlaceholderText("you@example.com"), "user@example.com");
    await userEvent.type(screen.getByPlaceholderText("Your password"), "password123");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => expect(screen.getByText(/Check your email/)).toBeInTheDocument());
    expect(screen.queryByText(/Taking you to your dashboard/)).not.toBeInTheDocument();
  });

  it("submits the code against the challenge it was issued", async () => {
    mockLogin.mockResolvedValue({
      status: "two_factor_required",
      challenge: "enc_challenge",
      email: "user@example.com",
    });
    mockVerifyTwoFactor.mockResolvedValue({ id: "1", role: "individual" });
    render(<LoginPage />);
    await userEvent.type(screen.getByPlaceholderText("you@example.com"), "user@example.com");
    await userEvent.type(screen.getByPlaceholderText("Your password"), "password123");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => expect(screen.getByPlaceholderText("000000")).toBeInTheDocument());
    await userEvent.type(screen.getByPlaceholderText("000000"), "123456");
    await userEvent.click(screen.getByRole("button", { name: /verify/i }));

    expect(mockVerifyTwoFactor).toHaveBeenCalledWith("enc_challenge", "123456", true);
    await waitFor(() =>
      expect(screen.getByText(/Taking you to your dashboard/)).toBeInTheDocument(),
    );
  });

  it("surfaces a rejected code and clears the input", async () => {
    mockLogin.mockResolvedValue({
      status: "two_factor_required",
      challenge: "enc_challenge",
      email: "user@example.com",
    });
    mockVerifyTwoFactor.mockRejectedValue({
      errors: { code: ["The sign-in code is invalid or has expired."] },
    });
    render(<LoginPage />);
    await userEvent.type(screen.getByPlaceholderText("you@example.com"), "user@example.com");
    await userEvent.type(screen.getByPlaceholderText("Your password"), "password123");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => expect(screen.getByPlaceholderText("000000")).toBeInTheDocument());
    await userEvent.type(screen.getByPlaceholderText("000000"), "000000");
    await userEvent.click(screen.getByRole("button", { name: /verify/i }));

    await waitFor(() =>
      expect(screen.getByText("The sign-in code is invalid or has expired.")).toBeInTheDocument(),
    );
    expect(screen.getByPlaceholderText("000000")).toHaveValue("");
    expect(screen.queryByText(/Taking you to your dashboard/)).not.toBeInTheDocument();
  });

  it("toggles password visibility", async () => {
    render(<LoginPage />);
    const input = screen.getByPlaceholderText("Your password");
    expect(input).toHaveAttribute("type", "password");
    await userEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(input).toHaveAttribute("type", "text");
  });
});
