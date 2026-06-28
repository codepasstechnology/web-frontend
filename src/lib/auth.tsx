import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { PlanId } from "./plans";

export type UserRole = "individual" | "agent" | "developer";

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
  plan: PlanId;
  listings: UserListing[];
  payments: { date: string; amount: number; plan: string; status: "Paid" | "Pending" }[];
  county?: string;
  bio?: string;
  company?: string;
  avatarColor?: string;
  notifications?: { emailInquiries: boolean; smsAlerts: boolean; weeklyDigest: boolean; marketing: boolean };
  twoFactor?: boolean;
  language?: "en" | "sw";
  isAdmin?: boolean;
}

interface AuthCtx {
  user: AppUser | null;
  ready: boolean;
  login: (email: string, _password: string) => AppUser;
  register: (data: { fullName: string; email: string; phone: string; password: string; role: UserRole }) => AppUser;
  logout: () => void;
  setPlan: (plan: PlanId) => void;
  addListing: (l: Omit<UserListing, "id" | "views" | "createdAt" | "status">) => void;
  removeListing: (id: string) => void;
  updateUser: (patch: Partial<AppUser>) => void;
  deleteAccount: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);
const KEY = "lv_user_v1";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(KEY) : null;
      if (raw) setUser(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  const persist = useCallback((u: AppUser | null) => {
    setUser(u);
    if (typeof window !== "undefined") {
      if (u) localStorage.setItem(KEY, JSON.stringify(u));
      else localStorage.removeItem(KEY);
    }
  }, []);

  const login: AuthCtx["login"] = (email) => {
    const u: AppUser = {
      id: "u_" + Math.random().toString(36).slice(2, 9),
      fullName: email.split("@")[0],
      email,
      phone: "",
      role: "individual",
      plan: "free",
      listings: [],
      payments: [],
      isAdmin: /^admin|admin@|@admin\./i.test(email),
    };
    persist(u);
    return u;
  };

  const register: AuthCtx["register"] = (data) => {
    const u: AppUser = {
      id: "u_" + Math.random().toString(36).slice(2, 9),
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      role: data.role,
      plan: "free",
      listings: [],
      payments: [],
      isAdmin: /^admin|admin@|@admin\./i.test(data.email),
    };
    persist(u);
    return u;
  };

  const logout = () => persist(null);

  const setPlan = (plan: PlanId) => {
    if (!user) return;
    const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
    const price = plan === "free" ? 0 : plan === "basic" ? 700 : 4500;
    persist({
      ...user,
      plan,
      payments: price
        ? [{ date: new Date().toISOString().slice(0, 10), amount: price, plan: planLabel, status: "Paid" }, ...user.payments]
        : user.payments,
    });
  };

  const addListing: AuthCtx["addListing"] = (l) => {
    if (!user) return;
    const newL: UserListing = {
      ...l,
      id: "L_" + Math.random().toString(36).slice(2, 9),
      views: 0,
      status: "pending",
      createdAt: new Date().toISOString().slice(0, 10),
    };
    persist({ ...user, listings: [newL, ...user.listings] });
  };

  const removeListing = (id: string) => {
    if (!user) return;
    persist({ ...user, listings: user.listings.filter((x) => x.id !== id) });
  };

  const updateUser: AuthCtx["updateUser"] = (patch) => {
    if (!user) return;
    persist({ ...user, ...patch });
  };

  const deleteAccount = () => persist(null);

  return (
    <Ctx.Provider value={{ user, ready, login, register, logout, setPlan, addListing, removeListing, updateUser, deleteAccount }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used inside <AuthProvider>");
  return c;
}