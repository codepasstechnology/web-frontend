import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { LogOut, Pencil, Search, Users } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";

export const Route = createFileRoute("/manager")({
  head: () => ({ meta: [{ title: "My Clients — LandVerify Kenya" }] }),
  component: ManagerPage,
});

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  county: string | null;
  company: string | null;
  bio: string | null;
  plan: string;
  listings_count: number;
  pending_kyc_count: number;
}

function ManagerPage() {
  const { user, ready, logout } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Client | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (ready && !user) navigate({ to: "/login" });
    else if (ready && user && user.role !== "account_manager")
      navigate({ to: "/dashboard", search: { tab: undefined } });
  }, [ready, user, navigate]);

  useEffect(() => {
    if (user?.role !== "account_manager") return;
    api
      .get<Client[]>("/user/manager/clients")
      .then(setClients)
      .finally(() => setLoading(false));
  }, [user]);

  const filteredClients = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.company?.toLowerCase().includes(q),
    );
  }, [clients, search]);

  const totalPendingKyc = useMemo(
    () => clients.reduce((sum, c) => sum + c.pending_kyc_count, 0),
    [clients],
  );

  if (!user || user.role !== "account_manager") return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-[#2563EB]" />
            <div>
              <div className="text-sm font-semibold text-foreground">My Clients</div>
              <div className="text-xs text-muted-foreground">Signed in as {user.fullName}</div>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              navigate({ to: "/login" });
            }}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading your clients…</p>
        ) : clients.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center">
            <h3 className="text-base font-semibold text-foreground">No clients assigned yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              An admin will assign clients to you from the Users console.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-4 text-sm">
                <div>
                  <span className="font-semibold text-foreground">{clients.length}</span>{" "}
                  <span className="text-muted-foreground">
                    client{clients.length === 1 ? "" : "s"}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-foreground">{totalPendingKyc}</span>{" "}
                  <span className="text-muted-foreground">pending KYC</span>
                </div>
              </div>
              <div className="relative sm:w-64">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search clients…"
                  className="h-9 w-full rounded-md border border-border bg-background pl-8 pr-3 text-sm focus:border-[#2563EB] focus:outline-none"
                />
              </div>
            </div>
            {filteredClients.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center">
                <p className="text-sm text-muted-foreground">No clients match "{search}".</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Client</th>
                      <th className="px-4 py-3">Plan</th>
                      <th className="px-4 py-3">Listings</th>
                      <th className="px-4 py-3">Pending KYC</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredClients.map((c) => (
                      <tr key={c.id}>
                        <td className="px-4 py-3">
                          <div className="font-medium text-foreground">{c.name}</div>
                          <div className="text-xs text-muted-foreground">{c.email}</div>
                        </td>
                        <td className="px-4 py-3 text-foreground">{c.plan}</td>
                        <td className="px-4 py-3 text-foreground">{c.listings_count}</td>
                        <td className="px-4 py-3">
                          {c.pending_kyc_count > 0 ? (
                            <span className="inline-flex rounded-md bg-[#FEF3C7] px-2 py-0.5 text-[11px] font-medium text-[#B45309]">
                              {c.pending_kyc_count} pending
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setEditing(c)}
                            className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs font-medium text-foreground hover:bg-muted"
                          >
                            <Pencil className="h-3.5 w-3.5" /> Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>

      {editing && (
        <EditClientModal
          client={editing}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            setClients((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function EditClientModal({
  client,
  onClose,
  onSaved,
}: {
  client: Client;
  onClose: () => void;
  onSaved: (c: Client) => void;
}) {
  const [form, setForm] = useState({
    phone: client.phone ?? "",
    county: client.county ?? "",
    company: client.company ?? "",
    bio: client.bio ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const updated = await api.put<Client>(`/user/manager/clients/${client.id}`, form);
      onSaved(updated);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message ?? "Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "h-9 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-[#2563EB] focus:outline-none";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-5 shadow-lg">
        <h2 className="text-base font-semibold text-foreground">Edit {client.name}</h2>
        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground">Phone</label>
            <input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground">County</label>
            <input
              value={form.county}
              onChange={(e) => setForm((f) => ({ ...f, county: e.target.value }))}
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground">Company</label>
            <input
              value={form.company}
              onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground">Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              rows={3}
              className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-[#2563EB] focus:outline-none"
            />
          </div>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="rounded-md bg-[#2563EB] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#1d4ed8] disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
