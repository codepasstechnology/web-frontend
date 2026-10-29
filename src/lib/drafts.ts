import { clearDraftPhotos } from "@/lib/draftPhotoStore";

export const LAND_DRAFT_KEY = "lv_upload_draft_v1";
export const PROPERTY_DRAFT_KEY = "lv_property_draft_v1";
const OWNER_KEY = "lv_draft_owner";

/**
 * Upload drafts are kept in this browser, not on the server, so they must
 * never carry over to another account on the same device. Pass the signed-in
 * user's id, or null on sign-out; drafts belonging to anyone else are wiped.
 */
export function claimDrafts(userId: string | null): void {
  try {
    if (userId !== null && localStorage.getItem(OWNER_KEY) === userId) return;
    for (const key of [LAND_DRAFT_KEY, PROPERTY_DRAFT_KEY]) {
      localStorage.removeItem(key);
      void clearDraftPhotos(key);
    }
    if (userId === null) localStorage.removeItem(OWNER_KEY);
    else localStorage.setItem(OWNER_KEY, userId);
  } catch {
    // Storage blocked: nothing was saved to leak either.
  }
}
