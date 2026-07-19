import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { AuthProvider, useAuth } from "@/lib/auth";

const mockApiPost = vi.fn();
const mockApiGet = vi.fn();
const mockSetToken = vi.fn();
const mockClearToken = vi.fn();
const mockGetToken = vi.fn(() => null);

vi.mock("@/lib/api", () => ({
  api: {
    get: (...args: unknown[]) => mockApiGet(...args),
    post: (...args: unknown[]) => mockApiPost(...args),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
    getBlob: vi.fn(),
  },
  getToken: () => mockGetToken(),
  setToken: (...args: unknown[]) => mockSetToken(...args),
  clearToken: () => mockClearToken(),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

const fakeApiUser = {
  id: 1,
  name: "Jane Mwangi",
  email: "jane@example.com",
  phone: "+254700000001",
  role: "individual",
  is_admin: false,
  avatar_color: null,
  county: null,
  bio: null,
  company: null,
  language: null,
  two_factor_enabled: false,
  notifications: null,
};

describe("AuthProvider — login", () => {
  beforeEach(() => {
    mockApiPost.mockReset();
    mockApiGet.mockReset();
    mockSetToken.mockReset();
    mockClearToken.mockReset();
    mockGetToken.mockReturnValue(null);

    // loadUser calls three endpoints in parallel
    mockApiGet.mockResolvedValue([]);
  });

  it("starts with user null and ready true when no token", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    // After mount (no token) — ready should become true
    await act(async () => {});
    expect(result.current.user).toBeNull();
    expect(result.current.ready).toBe(true);
  });

  it("login() calls the marketplace login endpoint and stores the token", async () => {
    mockApiPost.mockResolvedValue({ user: fakeApiUser, token: "tok_123" });
    // loadUser side effects
    mockApiGet.mockResolvedValue([]);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await result.current.login("jane@example.com", "secret");
    });

    expect(mockApiPost).toHaveBeenCalledWith("/auth/login", {
      email: "jane@example.com",
      password: "secret",
    });
    expect(mockSetToken).toHaveBeenCalledWith("tok_123", true);
    expect(result.current.user).not.toBeNull();
    expect(result.current.user?.email).toBe("jane@example.com");
  });

  it("login() with remember=false passes that flag to setToken", async () => {
    mockApiPost.mockResolvedValue({ user: fakeApiUser, token: "tok_456" });
    mockApiGet.mockResolvedValue([]);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await result.current.login("jane@example.com", "secret", false);
    });

    expect(mockSetToken).toHaveBeenCalledWith("tok_456", false);
  });

  it("logout() revokes the token and clears user state", async () => {
    // First log in
    mockApiPost.mockResolvedValueOnce({ user: fakeApiUser, token: "tok_789" });
    mockApiGet.mockResolvedValue([]);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await result.current.login("jane@example.com", "secret");
    });
    expect(result.current.user).not.toBeNull();

    // Then log out
    mockApiPost.mockResolvedValueOnce(undefined);
    await act(async () => {
      await result.current.logout();
    });

    expect(mockApiPost).toHaveBeenLastCalledWith("/auth/logout");
    expect(mockClearToken).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
  });

  it("logout() clears state even when the API call throws", async () => {
    mockApiPost.mockResolvedValueOnce({ user: fakeApiUser, token: "tok_x" });
    mockApiGet.mockResolvedValue([]);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await result.current.login("jane@example.com", "secret");
    });

    // Simulate revoke endpoint failing (e.g. already expired token)
    mockApiPost.mockRejectedValueOnce(new Error("Unauthenticated"));
    await act(async () => {
      await result.current.logout();
    });

    expect(mockClearToken).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
  });
});
