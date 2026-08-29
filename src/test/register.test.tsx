import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { RegisterPage } from "../routes/register";

const mockNavigate = vi.fn();
const mockSignupsOpen = vi.fn(() => true);

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
  useAuth: () => ({ register: vi.fn(), loginWithGoogle: vi.fn() }),
}));

vi.mock("@/lib/settings", () => ({
  useSignupsOpen: () => mockSignupsOpen(),
}));

vi.mock("@/components/GoogleSignInButton", () => ({
  GoogleSignInButton: () => <div data-testid="google-button" />,
}));

describe("RegisterPage — open_signups", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockSignupsOpen.mockReturnValue(true);
  });

  it("renders the form while sign-ups are open", () => {
    render(<RegisterPage />);
    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
    expect(screen.getByTestId("google-button")).toBeInTheDocument();
  });

  it("offers neither door once sign-ups are closed", () => {
    mockSignupsOpen.mockReturnValue(false);
    render(<RegisterPage />);

    expect(screen.getByText(/registrations are closed/i)).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("you@example.com")).not.toBeInTheDocument();
    expect(screen.queryByTestId("google-button")).not.toBeInTheDocument();
  });

  it("falls open when the platform setting is unknown", () => {
    // useSignupsOpen() returns true while the query is loading or has errored —
    // an unreachable settings endpoint must not block registration.
    mockSignupsOpen.mockReturnValue(true);
    render(<RegisterPage />);

    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
  });
});
