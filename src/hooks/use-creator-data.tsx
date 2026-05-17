import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type IncomingBooking = {
  id: string;
  customer_id: string;
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

export type PortfolioItem = {
  id: string;
  title: string;
  description: string | null;
  media_url: string;
  tags: string[] | null;
  created_at: string;
};

export type Slot = {
  id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
  note: string | null;
};

export type Package = {
  id: string;
  title: string;
  description: string | null;
  price_inr: number;
  delivery_days: number;
  is_active: boolean;
};

export function useIncomingBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<IncomingBooking[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) { setBookings([]); setLoading(false); return; }
    const { data } = await supabase
      .from("bookings")
      .select("id,customer_id,professional_handle,professional_name,category,city,event_date,status,budget_inr,requirements,created_at")
      .eq("creator_user_id", user.id)
      .order("created_at", { ascending: false });
    setBookings((data ?? []) as IncomingBooking[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);
  return { bookings, loading, refresh };
}

export function usePortfolio() {
  const { user } = useAuth();
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) { setItems([]); setLoading(false); return; }
    const { data } = await supabase
      .from("portfolio_items")
      .select("id,title,description,media_url,tags,created_at")
      .eq("creator_id", user.id)
      .order("created_at", { ascending: false });
    setItems((data ?? []) as PortfolioItem[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);
  return { items, loading, refresh };
}

export function useSlots() {
  const { user } = useAuth();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) { setSlots([]); setLoading(false); return; }
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabase
      .from("availability_slots")
      .select("id,slot_date,start_time,end_time,is_booked,note")
      .eq("creator_id", user.id)
      .gte("slot_date", today)
      .order("slot_date", { ascending: true });
    setSlots((data ?? []) as Slot[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);
  return { slots, loading, refresh };
}

export function usePackages() {
  const { user } = useAuth();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) { setPackages([]); setLoading(false); return; }
    const { data } = await supabase
      .from("pricing_packages")
      .select("id,title,description,price_inr,delivery_days,is_active")
      .eq("creator_id", user.id)
      .order("price_inr", { ascending: true });
    setPackages((data ?? []) as Package[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);
  return { packages, loading, refresh };
}