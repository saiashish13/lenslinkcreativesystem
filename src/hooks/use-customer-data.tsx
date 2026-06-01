import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type Booking = {
  id: string;
  professional_handle: string;
  professional_name: string;
  category: string;
  city: string | null;
  event_date: string | null;
  status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
  budget_inr: number | null;
  requirements: string | null;
  created_at: string;
};

export function useFavorites() {
  const { user } = useAuth();
  const [handles, setHandles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) { setHandles([]); setLoading(false); return; }
    const { data } = await supabase.from("favorites").select("professional_handle").eq("customer_id", user.id);
    setHandles((data ?? []).map((r) => r.professional_handle).filter((h): h is string => !!h));
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const toggle = useCallback(async (handle: string) => {
    if (!user) return;
    const exists = handles.includes(handle);
    if (exists) {
      setHandles((h) => h.filter((x) => x !== handle));
      await supabase.from("favorites").delete().eq("customer_id", user.id).eq("professional_handle", handle);
    } else {
      setHandles((h) => [...h, handle]);
      await supabase.from("favorites").insert({ customer_id: user.id, professional_handle: handle });
    }
  }, [user, handles]);

  return { handles, loading, toggle, isFavorite: (h: string) => handles.includes(h), refresh };
}

export function useBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) { setBookings([]); setLoading(false); return; }
    const { data } = await supabase
      .from("bookings")
      .select("id,professional_handle,professional_name,category,city,event_date,status,budget_inr,requirements,created_at")
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false });
    setBookings((data ?? []) as Booking[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  return { bookings, loading, refresh };
}