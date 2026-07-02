import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { DashShell } from "@/components/dash-shell";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  useAdminUsers,
  useToggleRole,
  useAdminBookings,
  useAdminAssignments,
  useAdminMetrics,
} from "@/hooks/use-admin-data";
import { formatINR } from "@/lib/format";
import { toast } from "sonner";
import type { AppRole } from "@/hooks/use-auth";
import { getMyRoles } from "@/lib/roles.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — LensLink AI" }] }),
  beforeLoad: async () => {
    const { roles } = await getMyRoles();
    if (!roles.includes("admin")) {
      throw redirect({ to: "/app" });
    }
  },
  component: AdminDash,
});

const ALL_ROLES: AppRole[] = ["customer", "photographer", "editor", "admin"];

function AdminDash() {
  useAuth();

  return (
    <DashShell title="Admin console" subtitle="Marketplace, users, payments, moderation.">
      <Overview />
      <Tabs defaultValue="users" className="mt-8">
        <TabsList>
          <TabsTrigger value="users">Users & roles</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="assignments">Editor pool</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
        </TabsList>
        <TabsContent value="users" className="mt-6"><UsersPanel /></TabsContent>
        <TabsContent value="bookings" className="mt-6"><BookingsPanel /></TabsContent>
        <TabsContent value="assignments" className="mt-6"><AssignmentsPanel /></TabsContent>
        <TabsContent value="revenue" className="mt-6"><RevenuePanel /></TabsContent>
      </Tabs>
    </DashShell>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card/60 p-5">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="font-display text-2xl mt-2">{value}</div>
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}

function Overview() {
  const { gmv, commission, counts, loading } = useAdminMetrics();
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <Stat label="Users" value={loading ? "—" : String(counts.users)} hint={`${counts.creators} creators · ${counts.editors} editors`} />
      <Stat label="Bookings" value={loading ? "—" : String(counts.bookings)} hint={`${counts.pendingBookings} pending · ${counts.completedBookings} completed`} />
      <Stat label="Gross volume" value={loading ? "—" : formatINR(gmv)} hint="Bookings + editor projects" />
      <Stat label="Commission (15%)" value={loading ? "—" : formatINR(commission)} hint="Estimated marketplace revenue" />
    </div>
  );
}

function UsersPanel() {
  const { data, isLoading } = useAdminUsers();
  const toggle = useToggleRole();
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return data ?? [];
    return (data ?? []).filter(
      (u) =>
        (u.full_name ?? "").toLowerCase().includes(term) ||
        (u.city ?? "").toLowerCase().includes(term) ||
        u.id.includes(term),
    );
  }, [data, q]);

  return (
    <div className="space-y-4">
      <Input placeholder="Search by name, city or user id…" value={q} onChange={(e) => setQ(e.target.value)} />
      {isLoading ? (
        <div className="text-muted-foreground">Loading users…</div>
      ) : filtered.length === 0 ? (
        <div className="text-muted-foreground">No users yet.</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((u) => (
            <div key={u.id} className="rounded-xl border border-border bg-card/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-medium">{u.full_name ?? "Unnamed user"}</div>
                  <div className="text-xs text-muted-foreground">{u.city ?? "—"} · {u.id.slice(0, 8)}…</div>
                </div>
                <div className="flex flex-wrap gap-4">
                  {ALL_ROLES.map((r) => {
                    const on = u.roles.includes(r);
                    return (
                      <label key={r} className="flex items-center gap-2 text-sm">
                        <Switch
                          checked={on}
                          onCheckedChange={(checked) =>
                            toggle.mutate(
                              { userId: u.id, role: r, enabled: checked },
                              {
                                onError: (e: unknown) =>
                                  toast.error(e instanceof Error ? e.message : "Failed"),
                                onSuccess: () => toast.success(`${r} ${checked ? "granted" : "revoked"}`),
                              },
                            )
                          }
                        />
                        <span className="capitalize">{r}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  confirmed: "secondary",
  in_progress: "secondary",
  completed: "default",
  cancelled: "destructive",
  open: "outline",
  in_review: "secondary",
  delivered: "default",
};

function BookingsPanel() {
  const { data, isLoading } = useAdminBookings();
  if (isLoading) return <div className="text-muted-foreground">Loading bookings…</div>;
  if (!data?.length) return <div className="text-muted-foreground">No bookings yet.</div>;
  return (
    <div className="space-y-2">
      {data.map((b) => (
        <div key={b.id} className="rounded-xl border border-border bg-card/60 p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-medium">{b.professional_name} <span className="text-muted-foreground">· {b.category}</span></div>
            <div className="text-xs text-muted-foreground mt-1">
              {b.city ?? "—"} · {b.event_date ?? "Date TBD"} · {new Date(b.created_at).toLocaleDateString("en-IN")}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm">{b.budget_inr ? formatINR(b.budget_inr) : "—"}</span>
            <Badge variant={STATUS_VARIANTS[b.status] ?? "outline"}>{b.status}</Badge>
          </div>
        </div>
      ))}
    </div>
  );
}

function AssignmentsPanel() {
  const { data, isLoading } = useAdminAssignments();
  if (isLoading) return <div className="text-muted-foreground">Loading assignments…</div>;
  if (!data?.length) return <div className="text-muted-foreground">No editor assignments yet.</div>;
  return (
    <div className="space-y-2">
      {data.map((a) => (
        <div key={a.id} className="rounded-xl border border-border bg-card/60 p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-medium">{a.title} <span className="text-muted-foreground">· {a.category ?? "general"}</span></div>
            <div className="text-xs text-muted-foreground mt-1">
              Deadline {a.deadline ?? "—"} · {a.editor_user_id ? "Claimed" : "Open"}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm">{a.budget_inr ? formatINR(a.budget_inr) : "—"}</span>
            <Badge variant={STATUS_VARIANTS[a.status] ?? "outline"}>{a.status}</Badge>
          </div>
        </div>
      ))}
    </div>
  );
}

function RevenuePanel() {
  const { data: bookings } = useAdminBookings();
  const byCity = useMemo(() => {
    const map = new Map<string, { count: number; gmv: number }>();
    (bookings ?? []).forEach((b) => {
      const key = b.city ?? "Unspecified";
      const cur = map.get(key) ?? { count: 0, gmv: 0 };
      cur.count += 1;
      cur.gmv += b.budget_inr ?? 0;
      map.set(key, cur);
    });
    return Array.from(map.entries()).sort((a, b) => b[1].gmv - a[1].gmv);
  }, [bookings]);

  const byCategory = useMemo(() => {
    const map = new Map<string, { count: number; gmv: number }>();
    (bookings ?? []).forEach((b) => {
      const cur = map.get(b.category) ?? { count: 0, gmv: 0 };
      cur.count += 1;
      cur.gmv += b.budget_inr ?? 0;
      map.set(b.category, cur);
    });
    return Array.from(map.entries()).sort((a, b) => b[1].gmv - a[1].gmv);
  }, [bookings]);

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Breakdown title="By city" rows={byCity} />
      <Breakdown title="By category" rows={byCategory} />
    </div>
  );
}

function Breakdown({ title, rows }: { title: string; rows: [string, { count: number; gmv: number }][] }) {
  return (
    <div className="rounded-xl border border-border bg-card/60 p-5">
      <div className="font-medium mb-3">{title}</div>
      {rows.length === 0 ? (
        <div className="text-sm text-muted-foreground">No data yet.</div>
      ) : (
        <div className="space-y-2">
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between text-sm">
              <span>{k} <span className="text-muted-foreground">· {v.count}</span></span>
              <span>{formatINR(v.gmv)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
