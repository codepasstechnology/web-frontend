import { describe, it, expect } from "vitest";
import { mapApiParcel, type ApiParcel } from "@/lib/parcels";

describe("mapApiParcel", () => {
  it("turns an API parcel into a map parcel", () => {
    const p = mapApiParcel({
      id: "a",
      parcel_number: "KAJ/1",
      price: 100,
      status: "verified",
      listing_type: "sale",
      land_type: "residential",
      area: "Kitengela",
      sv_available: true,
      latitude: "-1.5",
      longitude: "36.9",
      boundary: [
        { lat: "-1", lng: "36" },
        { lat: "-1", lng: "37" },
        { lat: "-2", lng: "37" },
      ],
      photos: null,
      amenities: null,
    } as unknown as ApiParcel);

    expect(p.status).toBe("verified");
    expect(p.polygon).toEqual([
      [-1, 36],
      [-1, 37],
      [-2, 37],
    ]);
    expect(p.latitude).toBe(-1.5);
    expect(p.photos).toEqual([]);
    expect(p.seller.name).toBe("—");
    expect(p.area).toBe("Kitengela");
    expect(p.landUse).toBe("Residential");
    expect(p.svAvailable).toBe(true);
  });

  it("treats a missing Street View result as not checked yet", () => {
    const p = mapApiParcel({
      id: "a",
      parcel_number: "KAJ/1",
      status: "available",
      boundary: null,
      photos: null,
      amenities: null,
    } as unknown as ApiParcel);

    expect(p.svAvailable).toBeNull();
    expect(p.polygon).toBeUndefined();
  });
});
