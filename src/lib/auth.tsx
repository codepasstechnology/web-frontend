import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api, getToken, setToken, clearToken } from "./api";

export type UserRole = "individual" | "agent" | "developer" | "account_manager";

export interface UserListing {
  id: string;
  title: string;
  parcelNumber: string;
  county: string;
  price: number;
  status: "pending" | "active" | "sold";
  views: number;
  createdAt: string;
}

export interface AppUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  plan: string;
  maxListings: number; // Infinity = unlimited
  analyticsAccess: boolean;
  bulkUpload: boolean;
  customReports: boolean;
  manager: { name: string; email: string } | null;
  listings: UserListing[];
  payments: { date: string; amount: number; plan: string; status: "Paid" | "Pending" }[];
  county?: string;
  bio?: string;
  company?: string;
  avatarColor?: string;
  notifications?: {
    emailInquiries: boolean;
    smsAlerts: boolean;
    weeklyDigest: boolean;
    marketing: boolean;
  };
  twoFactor?: boolean;
  language?: "en" | "sw";
  isAdmin?: boolean;
  emailVerified: boolean;
}

// ── API shapes ────────────────────────────────────────────────────────────────

interface ApiUser {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  is_admin: boolean;
  avatar_color: string | null;
  county: string | null;
  bio: string | null;
  company: string | null;
  language: string | null;
  two_factor_enabled: boolean;
  email_verified_at: string | null;
  notifications: {
    email_inquiries: boolean;
    sms_alerts: boolean;
    weekly_digest: boolean;
    marketing: boolean;
  } | null;
}

interface ApiListing {
  id: string;
  title: string;
  parcel_number: string;
  county: string;
  price: number;
  status: string;
  views: number;
  created_at: string;
}

interface ApiSubscription {
  plan: string;
  plan_name: string;
  status: string | null;
  max_listings?: number;
  analytics_access?: boolean;
  bulk_upload?: boolean;
  custom_reports?: boolean;
  dedicated_manager?: { name: string; email: string } | null;
}

interface ApiPayment {
  date: string;
  amount: number;
  plan: string;
  status: string;
}

interface AuthResponse {
  user: ApiUser;
  token: string;
}

// ── Mappers ───────────────────────────────────────────────────────────────────

function mapApiUser(
  u: ApiUser,
  listings: ApiListing[],
  sub: ApiSubscription,
  payments: ApiPayment[],
): AppUser {
  return {
    id: String(u.id),
    fullName: u.name,
    email: u.email,
    phone: u.phone ?? "",
    role: u.role as UserRole,
    plan: sub.plan ?? "free",
    maxListings:
      sub.max_listings === -1 || sub.max_listings === undefined ? Infinity : sub.max_listings,
    analyticsAccess: sub.analytics_access ?? false,
    bulkUpload: sub.bulk_upload ?? false,
    customReports: sub.custom_reports ?? false,
    manager: sub.dedicated_manager ?? null,
    isAdmin: u.is_admin ?? false,
    emailVerified: u.email_verified_at !== null,
    county: u.county ?? undefined,
    bio: u.bio ?? undefined,
    company: u.company ?? undefined,
    avatarColor: u.avatar_color ?? undefined,
    language: (u.language as "en" | "sw") ?? undefined,
    twoFactor: u.two_factor_enabled ?? false,
    notifications: u.notifications
      ? {
          emailInquiries: u.notifications.email_inquiries,
          smsAlerts: u.notifications.sms_alerts,
          weeklyDigest: u.notifications.weekly_digest,
          marketing: u.notifications.marketing,
        }
      : undefined,
    listings: listings.map((l) => ({
      id: l.id,
      title: l.title,
      parcelNumber: l.parcel_number,
      county: l.county,
      price: l.price,
      status: (l.status as UserListing["status"]) ?? "pending",
      views: l.views,
      createdAt: l.created_at,
    })),
    payments: payments.map((p) => ({
      date: p.date,
      amount: p.amount,
      plan: p.plan,
      status: (p.status === "Paid" ? "Paid" : "Pending") as "Paid" | "Pending",
    })),
  };
}

// ── Context ───────────────────────────────────────────────────────────────────

export interface NewListingInput {
  title: string;
  parcelNumber: string;
  county: string;
  area?: string;
  size?: string;
  price: number;
  description?: string;
  latitude?: number;
  longitude?: number;
  listingType?: "sale" | "lease";
  landType?: "residential" | "commercial" | "agricultural" | "mixed_use" | "industrial";
  titleDeedFile?: File;
  photoFiles?: File[];
}

interface AuthCtx {
  user: AppUser | null;
  ready: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<AppUser>;
  register: (data: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    role: UserRole;
  }) => Promise<AppUser>;
  logout: () => Promise<void>;
  setPlan: (plan: string) => void;
  addListing: (l: NewListingInput) => Promise<void>;
  bulkAddListings: (rows: { title: string; county: string; price: number }[]) => Promise<void>;
  removeListing: (id: string) => Promise<void>;
  updateUser: (patch: Partial<AppUser>) => Promise<void>;
  deleteAccount: () => Promise<void>;
  refreshListings: () => Promise<void>;
  verifyEmail: (code: string) => Promise<void>;
  resendVerificationCode: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [ready, setReady] = useState(false);

  async function loadUser(apiUser: ApiUser): Promise<AppUser> {
    const [listings, sub, payments] = await Promise.all([
      api.get<ApiListing[]>("/user/listings").catch(() => [] as ApiListing[]),
      api
        .get<ApiSubscription>("/user/subscription")
        .catch(() => ({ plan: "free", plan_name: "Free", status: null })),
      api.get<ApiPayment[]>("/user/payments").catch(() => [] as ApiPayment[]),
    ]);
    return mapApiUser(apiUser, listings, sub, payments);
  }

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setReady(true);
      return;
    }

    api
      .get<ApiUser>("/user/me")
      .then(loadUser)
      .then(setUser)
      .catch(() => clearToken())
      .finally(() => setReady(true));
  }, []);

  const login = async (email: string, password: string, remember = true): Promise<AppUser> => {
    const res = await api.post<AuthResponse>("/auth/login", { email, password });
    setToken(res.token, remember);
    const u = await loadUser(res.user);
    setUser(u);
    return u;
  };

  const register = async (data: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    role: UserRole;
  }): Promise<AppUser> => {
    const res = await api.post<AuthResponse>("/auth/register", {
      name: data.fullName,
      email: data.email,
      phone: data.phone || undefined,
      password: data.password,
      password_confirmation: data.password,
      role: data.role,
    });
    setToken(res.token);
    const u = await loadUser(res.user);
    setUser(u);
    return u;
  };

  const logout = async (): Promise<void> => {
    try {
      await api.post("/auth/logout");
    } catch {
      /* already invalid */
    }
    clearToken();
    setUser(null);
  };

  // Local-only: real payment integration wires here later
  const setPlan = useCallback((plan: string) => {
    setUser((prev) => (prev ? { ...prev, plan } : prev));
  }, []);

  const refreshListings = useCallback(async () => {
    const listings = await api.get<ApiListing[]>("/user/listings").catch(() => [] as ApiListing[]);
    setUser((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        listings: listings.map((l) => ({
          id: l.id,
          title: l.title,
          parcelNumber: l.parcel_number,
          county: l.county,
          price: l.price,
          status: (l.status as UserListing["status"]) ?? "pending",
          views: l.views,
          createdAt: l.created_at,
        })),
      };
    });
  }, []);

  const addListing: AuthCtx["addListing"] = useCallback(async (l) => {
    let body: FormData | Record<string, unknown>;
    if (l.titleDeedFile || l.photoFiles?.length) {
      const fd = new FormData();
      fd.append("title", l.title);
      fd.append("county", l.county);
      fd.append("price", String(l.price));
      fd.append("listing_type", l.listingType ?? "sale");
      fd.append("land_type", l.landType ?? "residential");
      if (l.parcelNumber) fd.append("parcel_number", l.parcelNumber);
      if (l.area) fd.append("area", l.area);
      if (l.size) fd.append("size", l.size);
      if (l.description) fd.append("description", l.description);
      if (l.latitude != null) fd.append("latitude", String(l.latitude));
      if (l.longitude != null) fd.append("longitude", String(l.longitude));
      if (l.titleDeedFile) fd.append("title_deed", l.titleDeedFile);
      l.photoFiles?.forEach((f) => fd.append("photos[]", f));
      body = fd;
    } else {
      body = {
        title: l.title,
        parcel_number: l.parcelNumber || undefined,
        county: l.county,
        area: l.area || undefined,
        size: l.size || undefined,
        price: l.price,
        description: l.description || undefined,
        latitude: l.latitude ?? undefined,
        longitude: l.longitude ?? undefined,
        listing_type: l.listingType ?? "sale",
        land_type: l.landType ?? "residential",
      };
    }
    const created = await api.post<ApiListing>("/user/listings", body);
    const newL: UserListing = {
      id: created.id,
      title: created.title,
      parcelNumber: created.parcel_number,
      county: created.county,
      price: created.price,
      status: "pending",
      views: 0,
      createdAt: created.created_at,
    };
    setUser((prev) => (prev ? { ...prev, listings: [newL, ...prev.listings] } : prev));
  }, []);

  const bulkAddListings: AuthCtx["bulkAddListings"] = useCallback(async (rows) => {
    const created = await api.post<ApiListing[]>("/user/listings/bulk", { listings: rows });
    const newListings: UserListing[] = created.map((l) => ({
      id: l.id,
      title: l.title,
      parcelNumber: l.parcel_number,
      county: l.county,
      price: l.price,
      status: "pending",
      views: 0,
      createdAt: l.created_at,
    }));
    setUser((prev) => (prev ? { ...prev, listings: [...newListings, ...prev.listings] } : prev));
  }, []);

  const removeListing = useCallback(async (id: string) => {
    await api.delete(`/user/listings/${id}`);
    setUser((prev) =>
      prev ? { ...prev, listings: prev.listings.filter((x) => x.id !== id) } : prev,
    );
  }, []);

  const updateUser: AuthCtx["updateUser"] = useCallback(async (patch) => {
    // Build only the fields the backend accepts
    const body: Record<string, unknown> = {};
    if (patch.fullName !== undefined) body.name = patch.fullName;
    if (patch.phone !== undefined) body.phone = patch.phone;
    if (patch.county !== undefined) body.county = patch.county;
    if (patch.bio !== undefined) body.bio = patch.bio;
    if (patch.company !== undefined) body.company = patch.company;
    if (patch.avatarColor !== undefined) body.avatar_color = patch.avatarColor;
    if (patch.language !== undefined) body.language = patch.language;
    if (patch.twoFactor !== undefined) body.two_factor_enabled = patch.twoFactor;
    if (patch.notifications) {
      body.notif_email_inquiries = patch.notifications.emailInquiries;
      body.notif_sms_alerts = patch.notifications.smsAlerts;
      body.notif_weekly_digest = patch.notifications.weeklyDigest;
      body.notif_marketing = patch.notifications.marketing;
    }

    if (Object.keys(body).length > 0) {
      await api.put("/user/profile", body);
    }

    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const deleteAccount = useCallback(async () => {
    await api.delete("/user/me");
    clearToken();
    setUser(null);
  }, []);

  const verifyEmail = useCallback(async (code: string) => {
    const apiUser = await api.post<ApiUser>("/auth/email/verify", { code });
    const u = await loadUser(apiUser);
    setUser(u);
  }, []);

  const resendVerificationCode = useCallback(async () => {
    await api.post("/auth/email/resend");
  }, []);

  return (
    <Ctx.Provider
      value={{
        user,
        ready,
        login,
        register,
        logout,
        setPlan,
        addListing,
        bulkAddListings,
        removeListing,
        updateUser,
        deleteAccount,
        refreshListings,
        verifyEmail,
        resendVerificationCode,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used inside <AuthProvider>");
  return c;
}
