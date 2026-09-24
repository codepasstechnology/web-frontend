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
  coverPhotoUrl: string | null;
}

export interface AppUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  plan: string;
  billingCycle: "monthly" | "yearly" | null;
  planStatus: string | null;
  planEndsAt: string | null;
  planCancelledAt: string | null;
  maxListings: number; // Infinity = unlimited
  analyticsAccess: boolean;
  customReports: boolean;
  manager: { name: string; email: string } | null;
  listings: UserListing[];
  payments: {
    number: string;
    date: string;
    amount: number;
    plan: string;
    status: "Paid" | "Pending" | "Failed" | "Refunded";
    downloadUrl: string;
  }[];
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
  /** Platform-wide setting — admins can turn the requirement off entirely. */
  emailVerificationRequired: boolean;
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
  email_verification_required?: boolean;
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
  cover_photo_url: string | null;
}

interface ApiListingDetail {
  id: string;
  title: string;
  parcel_number: string | null;
  county: string;
  seller_phone: string | null;
  area: string | null;
  size: string | null;
  area_acres: number | null;
  price: number;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  boundary: { lat: number; lng: number }[] | null;
  boundary_source: string | null;
  listing_type: string;
  land_type: string;
  utilities: string[];
  status: string;
  photos: { id: string; url: string; is_cover: boolean }[];
}

interface ApiSubscription {
  plan: string;
  plan_name: string;
  status: string | null;
  billing_cycle?: "monthly" | "yearly" | null;
  ends_at?: string | null;
  cancelled_at?: string | null;
  max_listings?: number;
  analytics_access?: boolean;
  custom_reports?: boolean;
  dedicated_manager?: { name: string; email: string } | null;
}

interface ApiPayment {
  number: string;
  date: string;
  amount: number;
  plan: string;
  status: string;
  download_url: string;
}

interface AuthResponse {
  user: ApiUser;
  token: string;
}

interface TwoFactorChallengeResponse {
  two_factor_required: true;
  challenge: string;
  email: string;
}

type LoginResponse = AuthResponse | TwoFactorChallengeResponse;

export type LoginResult =
  | { status: "authenticated"; user: AppUser }
  | { status: "two_factor_required"; challenge: string; email: string };

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
    billingCycle: sub.billing_cycle ?? null,
    planStatus: sub.status,
    planEndsAt: sub.ends_at ?? null,
    planCancelledAt: sub.cancelled_at ?? null,
    maxListings:
      sub.max_listings === -1 || sub.max_listings === undefined ? Infinity : sub.max_listings,
    analyticsAccess: sub.analytics_access ?? false,
    customReports: sub.custom_reports ?? false,
    manager: sub.dedicated_manager ?? null,
    isAdmin: u.is_admin ?? false,
    emailVerified: u.email_verified_at !== null,
    // Defaults to false so a backend that omits the field suppresses the
    // verification modal rather than hard-blocking the dashboard.
    emailVerificationRequired: u.email_verification_required ?? false,
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
      coverPhotoUrl: l.cover_photo_url,
    })),
    payments: payments.map((p) => ({
      number: p.number,
      date: p.date,
      amount: p.amount,
      plan: p.plan,
      status: p.status as "Paid" | "Pending" | "Failed" | "Refunded",
      downloadUrl: p.download_url,
    })),
  };
}

// ── Context ───────────────────────────────────────────────────────────────────

export interface NewListingInput {
  title: string;
  parcelNumber: string;
  county: string;
  phone?: string;
  area?: string;
  size?: string;
  areaAcres?: number;
  price: number;
  description?: string;
  latitude?: number;
  longitude?: number;
  boundary?: { lat: number; lng: number }[];
  boundarySource?: "traced" | "approximate";
  listingType?: "sale" | "lease";
  landType?: "residential" | "commercial" | "agricultural" | "mixed_use" | "industrial";
  utilities?: string[];
  documents?: { type: string; file: File }[];
  photoFiles?: File[];
}

export interface ListingEditInput extends NewListingInput {
  removePhotoIds?: string[];
  coverPhotoId?: string;
}

export interface ListingDetail {
  id: string;
  title: string;
  parcelNumber: string;
  county: string;
  phone?: string;
  area?: string;
  size?: string;
  areaAcres?: number;
  price: number;
  description?: string;
  latitude?: number;
  longitude?: number;
  boundary?: { lat: number; lng: number }[] | null;
  boundarySource?: "traced" | "approximate" | null;
  listingType: "sale" | "lease";
  landType: "residential" | "commercial" | "agricultural" | "mixed_use" | "industrial";
  utilities: string[];
  status: "pending" | "active" | "sold";
  photos: { id: string; url: string; isCover: boolean }[];
}

interface AuthCtx {
  user: AppUser | null;
  ready: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<LoginResult>;
  loginWithGoogle: (credential: string, role?: UserRole) => Promise<LoginResult>;
  verifyTwoFactor: (challenge: string, code: string, remember?: boolean) => Promise<AppUser>;
  resendTwoFactorCode: (challenge: string) => Promise<void>;
  enableTwoFactor: () => Promise<void>;
  confirmTwoFactor: (code: string) => Promise<void>;
  disableTwoFactor: (password: string) => Promise<void>;
  register: (data: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    role: UserRole;
  }) => Promise<AppUser>;
  logout: () => Promise<void>;
  setPlan: (plan: string) => void;
  addListing: (
    l: NewListingInput,
    onProgress?: (pct: number) => void,
    abortRef?: { current: (() => void) | null },
  ) => Promise<void>;
  fetchListing: (id: string) => Promise<ListingDetail>;
  updateListing: (
    id: string,
    l: ListingEditInput,
    onProgress?: (pct: number) => void,
    abortRef?: { current: (() => void) | null },
  ) => Promise<void>;
  removeListing: (id: string) => Promise<void>;
  markListingSold: (id: string) => Promise<void>;
  updateUser: (patch: Partial<AppUser>) => Promise<void>;
  deleteAccount: () => Promise<void>;
  refreshListings: () => Promise<void>;
  reloadUser: () => Promise<void>;
  startPlanCheckout: (
    planId: string,
    billingCycle: "monthly" | "yearly",
    phone: string,
  ) => Promise<{ invoiceId: string; checkoutRequestId: string | null }>;
  startBoostCheckout: (
    listingId: string,
    boostType: "boost" | "featured",
    phone: string,
  ) => Promise<{ invoiceId: string; checkoutRequestId: string | null }>;
  startCardCheckout: (
    planId: string,
    billingCycle: "monthly" | "yearly",
  ) => Promise<{ invoiceId: string; authorizationUrl: string }>;
  startBoostCardCheckout: (
    listingId: string,
    boostType: "boost" | "featured",
  ) => Promise<{ invoiceId: string; authorizationUrl: string }>;
  verifyCardPayment: (reference: string) => Promise<string>;
  previewPlanChange: (
    planId: string,
    billingCycle: "monthly" | "yearly",
  ) => Promise<{ amount: number; credited_days: number; ends_at: string }>;
  getInvoiceStatus: (invoiceId: string) => Promise<string>;
  cancelInvoice: (invoiceId: string) => Promise<void>;
  cancelSubscription: () => Promise<void>;
  verifyEmail: (code: string) => Promise<void>;
  resendVerificationCode: () => Promise<void>;
  changePassword: (current: string, next: string) => Promise<void>;
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

  const login = async (email: string, password: string, remember = true): Promise<LoginResult> => {
    const res = await api.post<LoginResponse>("/auth/login", { email, password });

    if ("two_factor_required" in res) {
      return { status: "two_factor_required", challenge: res.challenge, email: res.email };
    }

    setToken(res.token, remember);
    const u = await loadUser(res.user);
    setUser(u);
    return { status: "authenticated", user: u };
  };

  const loginWithGoogle = async (credential: string, role?: UserRole): Promise<LoginResult> => {
    const res = await api.post<LoginResponse>("/auth/google", { credential, role });

    if ("two_factor_required" in res) {
      return { status: "two_factor_required", challenge: res.challenge, email: res.email };
    }

    setToken(res.token);
    const u = await loadUser(res.user);
    setUser(u);
    return { status: "authenticated", user: u };
  };

  const verifyTwoFactor = async (
    challenge: string,
    code: string,
    remember = true,
  ): Promise<AppUser> => {
    const res = await api.post<AuthResponse>("/auth/two-factor/verify", { challenge, code });
    setToken(res.token, remember);
    const u = await loadUser(res.user);
    setUser(u);
    return u;
  };

  const resendTwoFactorCode = useCallback(async (challenge: string) => {
    await api.post("/auth/two-factor/resend", { challenge });
  }, []);

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

  const setPlan = useCallback((plan: string) => {
    setUser((prev) => (prev ? { ...prev, plan } : prev));
  }, []);

  const reloadUser = useCallback(async () => {
    const apiUser = await api.get<ApiUser>("/user/me").catch(() => null);
    if (!apiUser) return;
    const [listings, sub, payments] = await Promise.all([
      api.get<ApiListing[]>("/user/listings").catch(() => [] as ApiListing[]),
      api
        .get<ApiSubscription>("/user/subscription")
        .catch(() => ({ plan: "free", plan_name: "Free", status: null })),
      api.get<ApiPayment[]>("/user/payments").catch(() => [] as ApiPayment[]),
    ]);
    setUser(mapApiUser(apiUser, listings, sub, payments));
  }, []);

  const startPlanCheckout = useCallback(
    async (planId: string, billingCycle: "monthly" | "yearly", phone: string) => {
      const res = await api.post<{ invoice_id: string; checkout_request_id: string | null }>(
        "/user/subscription/checkout",
        { plan: planId, billing_cycle: billingCycle, phone },
      );
      return { invoiceId: res.invoice_id, checkoutRequestId: res.checkout_request_id };
    },
    [],
  );

  const startBoostCheckout = useCallback(
    async (listingId: string, boostType: "boost" | "featured", phone: string) => {
      const res = await api.post<{ invoice_id: string; checkout_request_id: string | null }>(
        "/user/listings/boost",
        { listing_id: listingId, boost_type: boostType, phone },
      );
      return { invoiceId: res.invoice_id, checkoutRequestId: res.checkout_request_id };
    },
    [],
  );

  const startCardCheckout = useCallback(
    async (planId: string, billingCycle: "monthly" | "yearly") => {
      const res = await api.post<{ invoice_id: string; authorization_url: string }>(
        "/user/subscription/checkout/card",
        { plan: planId, billing_cycle: billingCycle },
      );
      return { invoiceId: res.invoice_id, authorizationUrl: res.authorization_url };
    },
    [],
  );

  const startBoostCardCheckout = useCallback(
    async (listingId: string, boostType: "boost" | "featured") => {
      const res = await api.post<{ invoice_id: string; authorization_url: string }>(
        "/user/listings/boost/card",
        { listing_id: listingId, boost_type: boostType },
      );
      return { invoiceId: res.invoice_id, authorizationUrl: res.authorization_url };
    },
    [],
  );

  const verifyCardPayment = useCallback(async (reference: string) => {
    const res = await api.get<{ status: string }>(`/user/payments/paystack/${reference}/verify`);
    return res.status;
  }, []);

  const previewPlanChange = useCallback(
    async (planId: string, billingCycle: "monthly" | "yearly") =>
      api.post<{ amount: number; credited_days: number; ends_at: string }>(
        "/user/subscription/preview",
        { plan: planId, billing_cycle: billingCycle },
      ),
    [],
  );

  const getInvoiceStatus = useCallback(async (invoiceId: string) => {
    const res = await api.get<{ status: string }>(`/user/invoices/${invoiceId}/status`);
    return res.status;
  }, []);

  const cancelInvoice = useCallback(async (invoiceId: string) => {
    await api.post(`/user/invoices/${invoiceId}/cancel`);
  }, []);

  const cancelSubscription = useCallback(async () => {
    await api.post("/user/subscription/cancel");
    await reloadUser();
  }, [reloadUser]);

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
          coverPhotoUrl: l.cover_photo_url,
        })),
      };
    });
  }, []);

  const addListing: AuthCtx["addListing"] = useCallback(async (l, onProgress, abortRef) => {
    let body: FormData | Record<string, unknown>;
    const isMultipart = !!(l.documents?.length || l.photoFiles?.length);
    if (isMultipart) {
      const fd = new FormData();
      fd.append("title", l.title);
      fd.append("county", l.county);
      fd.append("price", String(l.price));
      fd.append("listing_type", l.listingType ?? "sale");
      fd.append("land_type", l.landType ?? "residential");
      if (l.parcelNumber) fd.append("parcel_number", l.parcelNumber);
      if (l.phone) fd.append("seller_phone", l.phone);
      if (l.area) fd.append("area", l.area);
      if (l.size) fd.append("size", l.size);
      if (l.areaAcres != null) fd.append("area_acres", String(l.areaAcres));
      if (l.description) fd.append("description", l.description);
      if (l.latitude != null) fd.append("latitude", String(l.latitude));
      if (l.longitude != null) fd.append("longitude", String(l.longitude));
      l.boundary?.forEach((p, i) => {
        fd.append(`boundary[${i}][lat]`, String(p.lat));
        fd.append(`boundary[${i}][lng]`, String(p.lng));
      });
      if (l.boundarySource) fd.append("boundary_source", l.boundarySource);
      l.utilities?.forEach((u, i) => fd.append(`utilities[${i}]`, u));
      l.documents?.forEach((d, i) => {
        fd.append(`documents[${i}][type]`, d.type);
        fd.append(`documents[${i}][file]`, d.file);
      });
      l.photoFiles?.forEach((f) => fd.append("photos[]", f));
      body = fd;
    } else {
      body = {
        title: l.title,
        parcel_number: l.parcelNumber || undefined,
        seller_phone: l.phone || undefined,
        county: l.county,
        area: l.area || undefined,
        size: l.size || undefined,
        area_acres: l.areaAcres ?? undefined,
        price: l.price,
        description: l.description || undefined,
        latitude: l.latitude ?? undefined,
        longitude: l.longitude ?? undefined,
        boundary: l.boundary ?? undefined,
        boundary_source: l.boundarySource ?? undefined,
        listing_type: l.listingType ?? "sale",
        land_type: l.landType ?? "residential",
        utilities: l.utilities ?? undefined,
      };
    }
    const created = isMultipart
      ? await api.postWithProgress<ApiListing>(
          "/user/listings",
          body as FormData,
          onProgress,
          abortRef,
        )
      : await api.post<ApiListing>("/user/listings", body);
    const newL: UserListing = {
      id: created.id,
      title: created.title,
      parcelNumber: created.parcel_number,
      county: created.county,
      price: created.price,
      status: "pending",
      views: 0,
      createdAt: created.created_at,
      coverPhotoUrl: created.cover_photo_url,
    };
    setUser((prev) => (prev ? { ...prev, listings: [newL, ...prev.listings] } : prev));
  }, []);

  const fetchListing: AuthCtx["fetchListing"] = useCallback(async (id) => {
    const d = await api.get<ApiListingDetail>(`/user/listings/${id}`);
    return {
      id: d.id,
      title: d.title,
      parcelNumber: d.parcel_number ?? "",
      phone: d.seller_phone ?? undefined,
      county: d.county,
      area: d.area ?? undefined,
      size: d.size ?? undefined,
      areaAcres: d.area_acres ?? undefined,
      price: d.price,
      description: d.description ?? undefined,
      latitude: d.latitude ?? undefined,
      longitude: d.longitude ?? undefined,
      boundary: d.boundary,
      boundarySource: (d.boundary_source as "traced" | "approximate" | null) ?? null,
      listingType: (d.listing_type as ListingDetail["listingType"]) ?? "sale",
      landType: (d.land_type as ListingDetail["landType"]) ?? "residential",
      utilities: d.utilities ?? [],
      status: (d.status as ListingDetail["status"]) ?? "pending",
      photos: d.photos.map((p) => ({ id: p.id, url: p.url, isCover: p.is_cover })),
    };
  }, []);

  const updateListing: AuthCtx["updateListing"] = useCallback(
    async (id, l, onProgress, abortRef) => {
      const fd = new FormData();
      fd.append("_method", "PATCH");
      fd.append("title", l.title);
      fd.append("county", l.county);
      fd.append("price", String(l.price));
      fd.append("listing_type", l.listingType ?? "sale");
      fd.append("land_type", l.landType ?? "residential");
      if (l.parcelNumber) fd.append("parcel_number", l.parcelNumber);
      if (l.phone) fd.append("seller_phone", l.phone);
      if (l.area) fd.append("area", l.area);
      if (l.size) fd.append("size", l.size);
      if (l.areaAcres != null) fd.append("area_acres", String(l.areaAcres));
      if (l.description) fd.append("description", l.description);
      if (l.latitude != null) fd.append("latitude", String(l.latitude));
      if (l.longitude != null) fd.append("longitude", String(l.longitude));
      l.boundary?.forEach((p, i) => {
        fd.append(`boundary[${i}][lat]`, String(p.lat));
        fd.append(`boundary[${i}][lng]`, String(p.lng));
      });
      if (l.boundarySource) fd.append("boundary_source", l.boundarySource);
      l.utilities?.forEach((u, i) => fd.append(`utilities[${i}]`, u));
      l.documents?.forEach((d, i) => {
        fd.append(`documents[${i}][type]`, d.type);
        fd.append(`documents[${i}][file]`, d.file);
      });
      l.photoFiles?.forEach((f) => fd.append("photos[]", f));
      l.removePhotoIds?.forEach((pid) => fd.append("remove_photo_ids[]", pid));
      if (l.coverPhotoId) fd.append("cover_photo_id", l.coverPhotoId);

      const updated = await api.postWithProgress<ApiListingDetail>(
        `/user/listings/${id}`,
        fd,
        onProgress,
        abortRef,
      );
      const coverPhotoUrl = updated.photos.find((p) => p.is_cover)?.url ?? null;
      setUser((prev) =>
        prev
          ? {
              ...prev,
              listings: prev.listings.map((x) =>
                x.id === id
                  ? {
                      ...x,
                      title: updated.title,
                      parcelNumber: updated.parcel_number ?? "",
                      county: updated.county,
                      price: updated.price,
                      status: (updated.status as UserListing["status"]) ?? "pending",
                      coverPhotoUrl,
                    }
                  : x,
              ),
            }
          : prev,
      );
    },
    [],
  );

  const removeListing = useCallback(async (id: string) => {
    await api.delete(`/user/listings/${id}`);
    setUser((prev) =>
      prev ? { ...prev, listings: prev.listings.filter((x) => x.id !== id) } : prev,
    );
  }, []);

  const markListingSold = useCallback(async (id: string) => {
    const { status } = await api.patch<{ status: UserListing["status"] }>(
      `/user/listings/${id}/sold`,
      {},
    );
    setUser((prev) =>
      prev
        ? {
            ...prev,
            listings: prev.listings.map((x) => (x.id === id ? { ...x, status } : x)),
          }
        : prev,
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

  const enableTwoFactor = useCallback(async () => {
    await api.post("/user/two-factor/enable");
  }, []);

  const confirmTwoFactor = useCallback(async (code: string) => {
    await api.post("/user/two-factor/confirm", { code });
    setUser((prev) => (prev ? { ...prev, twoFactor: true } : prev));
  }, []);

  const disableTwoFactor = useCallback(async (password: string) => {
    await api.delete("/user/two-factor", { password });
    setUser((prev) => (prev ? { ...prev, twoFactor: false } : prev));
  }, []);

  // The backend revokes every token, so there is no session left to log out of —
  // calling logout() here would 401 and trigger the hard redirect in api.ts.
  const changePassword = useCallback(async (current: string, next: string) => {
    await api.put("/user/password", {
      current_password: current,
      password: next,
      password_confirmation: next,
    });
    clearToken();
    setUser(null);
  }, []);

  return (
    <Ctx.Provider
      value={{
        user,
        ready,
        login,
        loginWithGoogle,
        register,
        logout,
        setPlan,
        addListing,
        fetchListing,
        updateListing,
        removeListing,
        markListingSold,
        updateUser,
        deleteAccount,
        refreshListings,
        reloadUser,
        startPlanCheckout,
        startBoostCheckout,
        startCardCheckout,
        startBoostCardCheckout,
        verifyCardPayment,
        previewPlanChange,
        getInvoiceStatus,
        cancelInvoice,
        cancelSubscription,
        verifyEmail,
        resendVerificationCode,
        changePassword,
        verifyTwoFactor,
        resendTwoFactorCode,
        enableTwoFactor,
        confirmTwoFactor,
        disableTwoFactor,
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
