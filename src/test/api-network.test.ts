import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from "vitest";
import { api, OFFLINE_MESSAGE } from "@/lib/api";

const ok = () =>
  new Response(JSON.stringify({ id: "listing-1" }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });

let fetchMock: Mock<(url: string, init: RequestInit) => Promise<Response>>;

beforeEach(() => {
  vi.useFakeTimers();
  fetchMock = vi.fn<(url: string, init: RequestInit) => Promise<Response>>();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("api on a bad connection", () => {
  it("says to check the internet connection instead of 'Failed to fetch'", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(api.get("/parcels")).rejects.toThrow(OFFLINE_MESSAGE);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries an upload with the same Idempotency-Key until it gets through", async () => {
    fetchMock
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(ok());

    const upload = api.post<{ id: string }>("/user/properties", new FormData());
    await vi.runAllTimersAsync();

    await expect(upload).resolves.toEqual({ id: "listing-1" });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    const keys = fetchMock.mock.calls.map(
      ([, init]) => (init.headers as Record<string, string>)["Idempotency-Key"],
    );
    expect(keys[0]).toMatch(/^[0-9a-f-]{36}$/);
    expect(new Set(keys).size).toBe(1);
  });

  it("gives up on an upload after a few retries with the same friendly message", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    const upload = api.post("/user/kyc", new FormData());
    const result = expect(upload).rejects.toThrow(OFFLINE_MESSAGE);
    await vi.runAllTimersAsync();

    await result;
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("never retries other requests, which may not be safe to repeat", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(api.post("/user/subscription/pay", { phone: "0712345678" })).rejects.toThrow(
      OFFLINE_MESSAGE,
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
