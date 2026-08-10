import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { AuthProvider, useAuth } from "@/lib/auth";

const mockApiPost = vi.fn();
const mockApiGet = vi.fn();
const mockApiPut = vi.fn();
const mockSetToken = vi.fn();
const mockClearToken = vi.fn();
const mockGetToken = vi.fn(() => null);

vi.mock("@/lib/api", () => ({
  api: {
    get: (...args: unknown[]) => mockApiGet(...args),
    post: (...args: unknown[]) => mockApiPost(...args),
    put: (...args: unknown[]) => mockApiPut(...args),
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
  email_verified_at: null,
  email_verification_required: true,
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

  it("carries the platform email-verification requirement onto the user", async () => {
    mockApiPost.mockResolvedValue({ user: fakeApiUser, token: "tok_flag" });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await result.current.login("jane@example.com", "secret");
    });

    expect(result.current.user?.emailVerificationRequired).toBe(true);
  });

  it("treats a missing requirement flag as not required", async () => {
    const { email_verification_required: _omitted, ...withoutFlag } = fakeApiUser;
    mockApiPost.mockResolvedValue({ user: withoutFlag, token: "tok_noflag" });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await result.current.login("jane@example.com", "secret");
    });

    expect(result.current.user?.emailVerificationRequired).toBe(false);
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

describe("AuthProvider — changePassword", () => {
  beforeEach(() => {
    mockApiPost.mockReset();
    mockApiGet.mockReset();
    mockApiPut.mockReset();
    mockSetToken.mockReset();
    mockClearToken.mockReset();
    mockGetToken.mockReturnValue(null);
    mockApiGet.mockResolvedValue([]);
  });

  async function loggedIn() {
    mockApiPost.mockResolvedValueOnce({ user: fakeApiUser, token: "tok_pw" });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await result.current.login("jane@example.com", "secret");
    });
    return result;
  }

  it("sends the snake_case payload to the password endpoint", async () => {
    const result = await loggedIn();
    mockApiPut.mockResolvedValueOnce({ message: "Password updated. Please sign in again." });

    await act(async () => {
      await result.current.changePassword("old-password123", "new-password123");
    });

    expect(mockApiPut).toHaveBeenCalledWith("/user/password", {
      current_password: "old-password123",
      password: "new-password123",
      password_confirmation: "new-password123",
    });
  });

  it("clears the local session on success because the backend revoked every token", async () => {
    const result = await loggedIn();
    expect(result.current.user).not.toBeNull();

    mockApiPut.mockResolvedValueOnce({ message: "Password updated. Please sign in again." });
    await act(async () => {
      await result.current.changePassword("old-password123", "new-password123");
    });

    expect(mockClearToken).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
    // The session is already dead server-side — logging out would 401.
    expect(mockApiPost).not.toHaveBeenCalledWith("/auth/logout");
  });

  it("keeps the user signed in when the password change fails", async () => {
    const result = await loggedIn();

    mockApiPut.mockRejectedValueOnce(
      Object.assign(new Error("The given data was invalid."), {
        status: 422,
        errors: { current_password: ["Your current password is incorrect."] },
      }),
    );

    await act(async () => {
      await expect(
        result.current.changePassword("wrong-password", "new-password123"),
      ).rejects.toThrow("The given data was invalid.");
    });

    expect(mockClearToken).not.toHaveBeenCalled();
    expect(result.current.user).not.toBeNull();
  });
});

describe("AuthProvider — two-factor", () => {
  beforeEach(() => {
    mockApiPost.mockReset();
    mockApiGet.mockReset();
    mockApiPut.mockReset();
    mockSetToken.mockReset();
    mockClearToken.mockReset();
    mockGetToken.mockReturnValue(null);
    mockApiGet.mockResolvedValue([]);
  });

  it("does not treat a two-factor challenge as a completed login", async () => {
    mockApiPost.mockResolvedValueOnce({
      two_factor_required: true,
      challenge: "enc_challenge",
      email: "jane@example.com",
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    let outcome: Awaited<ReturnType<typeof result.current.login>>;
    await act(async () => {
      outcome = await result.current.login("jane@example.com", "secret");
    });

    expect(outcome!).toEqual({
      status: "two_factor_required",
      challenge: "enc_challenge",
      email: "jane@example.com",
    });
    expect(mockSetToken).not.toHaveBeenCalled();
    expect(result.current.user).toBeNull();
  });

  it("loginWithGoogle posts the credential and role, then stores the token", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    mockApiPost.mockResolvedValueOnce({ user: fakeApiUser, token: "tok_google" });
    await act(async () => {
      await result.current.loginWithGoogle("google_id_token", "agent");
    });

    expect(mockApiPost).toHaveBeenCalledWith("/auth/google", {
      credential: "google_id_token",
      role: "agent",
    });
    expect(mockSetToken).toHaveBeenCalledWith("tok_google");
    expect(result.current.user?.email).toBe("jane@example.com");
  });

  it("loginWithGoogle surfaces a two-factor challenge without storing a token", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    mockApiPost.mockResolvedValueOnce({
      two_factor_required: true,
      challenge: "enc_challenge",
      email: "jane@example.com",
    });

    let outcome: Awaited<ReturnType<typeof result.current.loginWithGoogle>>;
    await act(async () => {
      outcome = await result.current.loginWithGoogle("google_id_token");
    });

    expect(outcome!.status).toBe("two_factor_required");
    expect(mockSetToken).not.toHaveBeenCalled();
    expect(result.current.user).toBeNull();
  });

  it("verifyTwoFactor exchanges the code for a token and loads the user", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    mockApiPost.mockResolvedValueOnce({ user: fakeApiUser, token: "tok_2fa" });
    await act(async () => {
      await result.current.verifyTwoFactor("enc_challenge", "123456", false);
    });

    expect(mockApiPost).toHaveBeenCalledWith("/auth/two-factor/verify", {
      challenge: "enc_challenge",
      code: "123456",
    });
    expect(mockSetToken).toHaveBeenCalledWith("tok_2fa", false);
    expect(result.current.user?.email).toBe("jane@example.com");
  });

  it("a rejected code leaves the user signed out", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    mockApiPost.mockRejectedValueOnce(
      Object.assign(new Error("The given data was invalid."), {
        status: 422,
        errors: { code: ["The sign-in code is invalid or has expired."] },
      }),
    );

    await act(async () => {
      await expect(result.current.verifyTwoFactor("enc_challenge", "000000")).rejects.toThrow();
    });

    expect(mockSetToken).not.toHaveBeenCalled();
    expect(result.current.user).toBeNull();
  });
});
