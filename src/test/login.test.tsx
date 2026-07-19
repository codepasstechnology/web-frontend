import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginPage } from "../routes/login";

const mockNavigate = vi.fn();
const mockLogin = vi.fn();

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
  useAuth: () => ({ login: mockLogin }),
}));

describe("LoginPage", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockLogin.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders email and password inputs", () => {
    render(<LoginPage />);
    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("shows error when email is empty", async () => {
    render(<LoginPage />);
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));
    expect(screen.getByText("Email is required.")).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("shows error when password is empty", async () => {
    render(<LoginPage />);
    await userEvent.type(screen.getByPlaceholderText("you@example.com"), "user@example.com");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));
    expect(screen.getByText("Password is required.")).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("calls login() with the entered email and password", async () => {
    mockLogin.mockResolvedValue({ id: "1", role: "individual" });
    render(<LoginPage />);
    await userEvent.type(screen.getByPlaceholderText("you@example.com"), "user@example.com");
    await userEvent.type(screen.getByPlaceholderText("••••••••"), "password123");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));
    expect(mockLogin).toHaveBeenCalledWith("user@example.com", "password123", false);
  });

  it("shows the API error message on login failure", async () => {
    mockLogin.mockRejectedValue({ errors: { email: ["Invalid credentials."] } });
    render(<LoginPage />);
    await userEvent.type(screen.getByPlaceholderText("you@example.com"), "user@example.com");
    await userEvent.type(screen.getByPlaceholderText("••••••••"), "wrongpass");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => expect(screen.getByText("Invalid credentials.")).toBeInTheDocument());
  });

  it("falls back to message when errors object is absent", async () => {
    mockLogin.mockRejectedValue({ message: "Account is locked." });
    render(<LoginPage />);
    await userEvent.type(screen.getByPlaceholderText("you@example.com"), "user@example.com");
    await userEvent.type(screen.getByPlaceholderText("••••••••"), "pass");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => expect(screen.getByText("Account is locked.")).toBeInTheDocument());
  });

  it("shows success state after successful login", async () => {
    mockLogin.mockResolvedValue({ id: "1", role: "individual" });
    render(<LoginPage />);
    await userEvent.type(screen.getByPlaceholderText("you@example.com"), "user@example.com");
    await userEvent.type(screen.getByPlaceholderText("••••••••"), "password123");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));
    // Success UI renders immediately; the 1500ms navigation timer fires after the test
    await waitFor(() =>
      expect(screen.getByText("Taking you to your dashboard…")).toBeInTheDocument(),
    );
  });

  it("toggles password visibility", async () => {
    render(<LoginPage />);
    const input = screen.getByPlaceholderText("••••••••");
    expect(input).toHaveAttribute("type", "password");
    // The toggle button has no accessible name — find by its position in the DOM
    const toggleBtn = input.parentElement!.querySelector("button")!;
    await userEvent.click(toggleBtn);
    expect(input).toHaveAttribute("type", "text");
  });
});
