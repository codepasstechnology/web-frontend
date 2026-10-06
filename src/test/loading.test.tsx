import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { LoadingScreen } from "@/components/auth/LoadingScreen";
import { LoadingPage } from "../routes/loading";

const mockNavigate = vi.fn();
const mockRouter = { preloadRoute: vi.fn(() => Promise.resolve()) };
const auth = {
  user: { fullName: "Wanjiku Kamau", role: "individual" } as {
    fullName: string;
    role: string;
  } | null,
  ready: true,
};

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (opts: object) => ({ ...opts, useSearch: () => ({ mode: "login" }) }),
  useNavigate: () => mockNavigate,
  useRouter: () => mockRouter,
}));

vi.mock("@/lib/auth", () => ({ useAuth: () => auth }));

describe("LoadingScreen", () => {
  it("greets a returning user by first name", () => {
    render(<LoadingScreen mode="login" name="Wanjiku Kamau" fading={false} />);
    expect(screen.getByRole("heading", { name: "Welcome back, Wanjiku." })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Finding your saved plots");
    expect(screen.getByText("almost there…")).toBeInTheDocument();
  });

  it("welcomes a new account with Karibu and the sign-up note", () => {
    render(<LoadingScreen mode="signup" name="Wanjiku Kamau" fading={false} />);
    expect(screen.getByRole("heading", { name: "Karibu, Wanjiku." })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Setting up your account");
    expect(screen.getByText("your map is almost ready!")).toBeInTheDocument();
  });

  it("falls back to 'there' when the name is missing", () => {
    render(<LoadingScreen mode="login" name="" fading={false} />);
    expect(screen.getByRole("heading", { name: "Welcome back, there." })).toBeInTheDocument();
  });

  it("fades out once the dashboard is ready", () => {
    const { container } = render(<LoadingScreen mode="login" name="Wanjiku" fading />);
    expect(container.querySelector(".ga-load")).toHaveClass("is-out");
  });
});

describe("loading route", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockNavigate.mockReset();
    mockRouter.preloadRoute.mockClear();
    auth.user = { fullName: "Wanjiku Kamau", role: "individual" };
    auth.ready = true;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("waits at least 1.5s, fades, then opens the dashboard", async () => {
    render(<LoadingPage />);
    await act(() => vi.advanceTimersByTimeAsync(1499));
    expect(mockNavigate).not.toHaveBeenCalled();
    await act(() => vi.advanceTimersByTimeAsync(1));
    await act(() => vi.advanceTimersByTimeAsync(400));
    expect(mockNavigate).toHaveBeenCalledWith({ to: "/dashboard", search: { tab: undefined } });
  });

  it("sends account managers to the manager page", async () => {
    auth.user = { fullName: "Ada", role: "account_manager" };
    render(<LoadingPage />);
    await act(() => vi.advanceTimersByTimeAsync(1500));
    await act(() => vi.advanceTimersByTimeAsync(400));
    expect(mockNavigate).toHaveBeenCalledWith({ to: "/manager" });
  });

  it("waits for the dashboard code to load before fading", async () => {
    let finishPreload: () => void = () => {};
    mockRouter.preloadRoute.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        finishPreload = resolve;
      }),
    );
    render(<LoadingPage />);
    await act(() => vi.advanceTimersByTimeAsync(2000));
    expect(mockNavigate).not.toHaveBeenCalled();
    await act(async () => finishPreload());
    await act(() => vi.advanceTimersByTimeAsync(1));
    await act(() => vi.advanceTimersByTimeAsync(400));
    expect(mockNavigate).toHaveBeenCalledWith({ to: "/dashboard", search: { tab: undefined } });
  });

  it("returns to sign-in when there is no signed-in user", () => {
    auth.user = null;
    render(<LoadingPage />);
    expect(mockNavigate).toHaveBeenCalledWith({ to: "/login" });
  });
});
