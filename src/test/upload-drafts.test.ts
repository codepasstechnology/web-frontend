import { describe, it, expect, vi, beforeEach } from "vitest";

const mockClearPhotos = vi.fn(() => Promise.resolve());
vi.mock("@/lib/draftPhotoStore", () => ({ clearDraftPhotos: mockClearPhotos }));

const { claimDrafts, LAND_DRAFT_KEY, PROPERTY_DRAFT_KEY } = await import("@/lib/drafts");

describe("upload drafts", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("keeps a draft for the account that wrote it", () => {
    claimDrafts("user-a");
    localStorage.setItem(LAND_DRAFT_KEY, '{"step":2}');

    claimDrafts("user-a");

    expect(localStorage.getItem(LAND_DRAFT_KEY)).toBe('{"step":2}');
    expect(mockClearPhotos).toHaveBeenCalledTimes(2);
  });

  it("wipes another account's drafts, photos included, before they can load", () => {
    claimDrafts("user-a");
    localStorage.setItem(LAND_DRAFT_KEY, '{"step":2}');
    localStorage.setItem(PROPERTY_DRAFT_KEY, '{"step":1}');
    mockClearPhotos.mockClear();

    claimDrafts("user-b");

    expect(localStorage.getItem(LAND_DRAFT_KEY)).toBeNull();
    expect(localStorage.getItem(PROPERTY_DRAFT_KEY)).toBeNull();
    expect(mockClearPhotos).toHaveBeenCalledWith(LAND_DRAFT_KEY);
    expect(mockClearPhotos).toHaveBeenCalledWith(PROPERTY_DRAFT_KEY);
  });

  it("wipes drafts on sign-out", () => {
    claimDrafts("user-a");
    localStorage.setItem(LAND_DRAFT_KEY, '{"step":2}');

    claimDrafts(null);
    claimDrafts("user-a");

    expect(localStorage.getItem(LAND_DRAFT_KEY)).toBeNull();
  });

  it("wipes drafts saved before they were tied to an account", () => {
    localStorage.setItem(LAND_DRAFT_KEY, '{"step":2}');

    claimDrafts("user-b");

    expect(localStorage.getItem(LAND_DRAFT_KEY)).toBeNull();
  });
});
