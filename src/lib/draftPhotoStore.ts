// Photo drafts live in IndexedDB rather than localStorage: File/Blob objects
// are structured-clonable there, so photos survive a refresh the same way the
// rest of a draft's form fields already do via localStorage.
const DB_NAME = "lv_draft_photos";
const DB_VERSION = 1;
const STORE = "photos";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveDraftPhotos(draftKey: string, files: File[]): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(files, draftKey);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // Best-effort — a full or unavailable IndexedDB just means photos
    // won't survive a refresh; the rest of the draft still will.
  }
}

export async function loadDraftPhotos(draftKey: string): Promise<File[]> {
  if (typeof indexedDB === "undefined") return [];
  try {
    const db = await openDb();
    const files = await new Promise<File[]>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(draftKey);
      req.onsuccess = () => resolve((req.result as File[] | undefined) ?? []);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return files;
  } catch {
    return [];
  }
}

export async function clearDraftPhotos(draftKey: string): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(draftKey);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // Nothing to clean up if it never opened.
  }
}
