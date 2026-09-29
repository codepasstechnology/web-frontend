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
  });
});
