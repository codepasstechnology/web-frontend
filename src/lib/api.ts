const BASE = import.meta.env.VITE_API_URL ?? "http://localhost/Landconnect/backend/public/api";
const TOKEN_KEY = "lv_token_v1";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string, persistent = true): void {
  if (typeof window === "undefined") return;
  if (persistent) {
    localStorage.setItem(TOKEN_KEY, token);
    sessionStorage.removeItem(TOKEN_KEY);
  } else {
    sessionStorage.setItem(TOKEN_KEY, token);
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
}

async function request<T>(
  path: string,
  opts: { method?: string; body?: unknown } = {},
): Promise<T> {
  const isFormData = opts.body instanceof FormData;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (!isFormData) headers["Content-Type"] = "application/json";
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method: opts.method ?? "GET",
    headers,
    body:
      opts.body !== undefined
        ? isFormData
          ? (opts.body as FormData)
          : JSON.stringify(opts.body)
        : undefined,
  });

  if (res.status === 401) {
    clearToken();
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new Error("Unauthenticated");
  }

  if (!res.ok) {
    const payload = await res.json().catch(() => ({ message: fallbackErrorMessage(res.status) }));
    throw Object.assign(new Error(payload.message ?? fallbackErrorMessage(res.status)), {
      status: res.status,
      errors: (payload.errors ?? {}) as Record<string, string[]>,
    });
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

function fallbackErrorMessage(status: number): string {
  if (status === 413) return "That upload is too large. Try smaller files or fewer photos.";
  if (status === 504 || status === 502 || status === 503) {
    return "The server took too long to respond. Check your connection and try again.";
  }
  return "Something went wrong. Please try again.";
}

function uploadWithProgress<T>(
  path: string,
  body: FormData,
  onProgress?: (pct: number) => void,
  abortRef?: { current: (() => void) | null },
): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${BASE}${path}`);
    xhr.setRequestHeader("Accept", "application/json");
    const token = getToken();
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    if (abortRef) abortRef.current = () => xhr.abort();

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };

    xhr.onabort = () => reject(Object.assign(new Error("Upload cancelled."), { aborted: true }));

    xhr.onload = () => {
      if (xhr.status === 401) {
        clearToken();
        if (typeof window !== "undefined") window.location.href = "/login";
        reject(new Error("Unauthenticated"));
        return;
      }

      let payload: { message?: string; errors?: Record<string, string[]> };
      try {
        payload = JSON.parse(xhr.responseText);
      } catch {
        payload = { message: fallbackErrorMessage(xhr.status) };
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(payload as T);
      } else {
        reject(
          Object.assign(new Error(payload.message ?? fallbackErrorMessage(xhr.status)), {
            status: xhr.status,
            errors: payload.errors ?? {},
          }),
        );
      }
    };

    xhr.onerror = () => reject(new Error("Network error. Check your connection and try again."));
    xhr.send(body);
  });
}

async function requestBlob(path: string): Promise<Blob> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { headers });

  if (res.status === 401) {
    clearToken();
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new Error("Unauthenticated");
  }

  if (!res.ok) throw new Error("Request failed");

  return res.blob();
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface BlogPostAuthor {
  name: string;
  avatar: string | null;
  avatar_color: string | null;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  cover_url: string | null;
  read_minutes: number;
  published_at: string | null;
  author: BlogPostAuthor | null;
  /** Only returned by the single-post endpoint. */
  content?: string;
}

export interface Paginated<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: "PUT", body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  getBlob: (path: string) => requestBlob(path),
  postWithProgress: <T>(
    path: string,
    body: FormData,
    onProgress?: (pct: number) => void,
    abortRef?: { current: (() => void) | null },
  ) => uploadWithProgress<T>(path, body, onProgress, abortRef),
};
