import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMapParcels, useParcel } from "@/lib/parcels";
import { usePublicProperties } from "@/lib/properties";
import type { Bbox } from "@/lib/mapGeo";
import { api } from "@/lib/api";
import { countyCenter } from "@/lib/countyCenters";
import { kenyaCounties } from "@/lib/plans";

vi.mock("@/lib/api", () => ({ api: { get: vi.fn() } }));

function wrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

afterEach(() => vi.clearAllMocks());

describe("map loading", () => {
  it("waits for the first viewport before loading map parcels", async () => {
    vi.mocked(api.get).mockResolvedValue([]);
    const hook = renderHook(({ bbox }: { bbox: Bbox | null }) => useMapParcels(bbox), {
      wrapper: wrapper(),
      initialProps: { bbox: null as Bbox | null },
    });
    expect(api.get).not.toHaveBeenCalled();
    hook.rerender({ bbox: [36, -2, 38, 0] });
    await waitFor(() => expect(hook.result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith(
      expect.stringMatching(/^\/parcels\?map=1&bbox=/),
      expect.any(AbortSignal),
    );
  });

  it("cancels an outdated area request and loads the new bounds", async () => {
    const signals: AbortSignal[] = [];
    vi.mocked(api.get).mockImplementation((_path, signal) => {
      signals.push(signal!);
      return new Promise(() => {});
    });
    const hook = renderHook(({ bbox }) => useMapParcels(bbox), {
      wrapper: wrapper(),
      initialProps: { bbox: [36, -2, 38, 0] as Bbox },
    });
    await waitFor(() => expect(signals).toHaveLength(1));
    hook.rerender({ bbox: [39, -5, 40, -3] });
    await waitFor(() => expect(signals).toHaveLength(2));
    expect(signals[0].aborted).toBe(true);
    expect(signals[1].aborted).toBe(false);
    hook.unmount();
    expect(signals[1].aborted).toBe(true);
  });

  it("waits for bounds for map properties, while the home feed still loads normally", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });
    const hook = renderHook(
      ({ bbox }: { bbox: Bbox | null }) => usePublicProperties({}, bbox, true),
      {
        wrapper: wrapper(),
        initialProps: { bbox: null as Bbox | null },
      },
    );
    expect(api.get).not.toHaveBeenCalled();
    hook.rerender({ bbox: [36, -2, 38, 0] });
    await waitFor(() => expect(hook.result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith(
      expect.stringContaining("&map=1"),
      expect.any(AbortSignal),
    );
    vi.mocked(api.get).mockClear();
    const home = renderHook(() => usePublicProperties(), { wrapper: wrapper() });
    await waitFor(() => expect(home.result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith("/properties", expect.any(AbortSignal));
  });

  it("fetches complete details by id independently of the visible area", async () => {
    vi.mocked(api.get).mockResolvedValue({
      id: "outside-area",
      seller_phone: "0712345678",
      description: "Full details",
    });
    const hook = renderHook(() => useParcel("outside-area"), { wrapper: wrapper() });
    await waitFor(() => expect(hook.result.current.isSuccess).toBe(true));
    expect(hook.result.current.data?.seller.phone).toBe("0712345678");
    expect(api.get).toHaveBeenCalledWith("/parcels/outside-area", expect.any(AbortSignal));
  });

  it("has a local starting point for every selectable county", () => {
    for (const county of kenyaCounties) expect(countyCenter(county), county).toBeDefined();
    expect(countyCenter("Muranga County")).toEqual(countyCenter("Murang'a"));
    expect(countyCenter("unknown")).toBeUndefined();
  });
});
