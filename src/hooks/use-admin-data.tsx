import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { AppRole } from "@/hooks/use-auth";

export function useAdminUsers() {
  const { roles } = useAuth();
  const isAdmin = roles.includes("admin");
  return useQuery({
    enabled: isAdmin,
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const [{ data: profiles }, { data: allRoles }] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      const map = new Map<string, AppRole[]>();
      (allRoles ?? []).forEach((r) => {
        const arr = map.get(r.user_id) ?? [];
        arr.push(r.role as AppRole);
        map.set(r.user_id, arr);
      });
      return (profiles ?? []).map((p) => ({ ...p, roles: map.get(p.id) ?? [] }));
    },
  });
}

export function useToggleRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role, enabled }: { userId: string; role: AppRole; enabled: boolean }) => {
      if (enabled) {
        const { error } = await supabase.from("user_roles").upsert(
          { user_id: userId, role },
          { onConflict: "user_id,role" },
        );
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useAdminBookings() {
  const { roles } = useAuth();
  const isAdmin = roles.includes("admin");
  return useQuery({
    enabled: isAdmin,
    queryKey: ["admin", "bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAdminAssignments() {
  const { roles } = useAuth();
  const isAdmin = roles.includes("admin");
  return useQuery({
    enabled: isAdmin,
    queryKey: ["admin", "assignments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("editor_assignments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAdminMetrics() {
  const bookings = useAdminBookings();
  const assignments = useAdminAssignments();
  const users = useAdminUsers();

  const COMMISSION_RATE = 0.15;
  const bookingRevenue = (bookings.data ?? [])
    .filter((b) => b.status === "completed" || b.status === "in_progress" || b.status === "confirmed")
    .reduce((sum, b) => sum + (b.budget_inr ?? 0), 0);
  const editorRevenue = (assignments.data ?? [])
    .filter((a) => a.status === "delivered" || a.status === "in_review" || a.status === "in_progress")
    .reduce((sum, a) => sum + (a.budget_inr ?? 0), 0);
  const gmv = bookingRevenue + editorRevenue;
  const commission = Math.round(gmv * COMMISSION_RATE);

  const counts = {
    users: users.data?.length ?? 0,
    creators: (users.data ?? []).filter((u) => u.roles.includes("photographer")).length,
    editors: (users.data ?? []).filter((u) => u.roles.includes("editor")).length,
    admins: (users.data ?? []).filter((u) => u.roles.includes("admin")).length,
    bookings: bookings.data?.length ?? 0,
    pendingBookings: (bookings.data ?? []).filter((b) => b.status === "pending").length,
    completedBookings: (bookings.data ?? []).filter((b) => b.status === "completed").length,
    cancelledBookings: (bookings.data ?? []).filter((b) => b.status === "cancelled").length,
    openAssignments: (assignments.data ?? []).filter((a) => a.status === "open").length,
    deliveredAssignments: (assignments.data ?? []).filter((a) => a.status === "delivered").length,
  };

  return {
    loading: bookings.isLoading || assignments.isLoading || users.isLoading,
    gmv,
    commission,
    counts,
  };
}