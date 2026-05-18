import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export function useMessages(bookingId: string | null) {
  const qc = useQueryClient();
  const query = useQuery({
    enabled: !!bookingId,
    queryKey: ["messages", bookingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("booking_id", bookingId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!bookingId) return;
    const ch = supabase
      .channel(`messages:${bookingId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `booking_id=eq.${bookingId}` },
        () => qc.invalidateQueries({ queryKey: ["messages", bookingId] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [bookingId, qc]);

  return query;
}

export function useSendMessage(bookingId: string | null) {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: string) => {
      if (!user || !bookingId) throw new Error("Not ready");
      const { error } = await supabase.from("messages").insert({
        booking_id: bookingId,
        sender_id: user.id,
        body: body.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["messages", bookingId] }),
  });
}

export function useNotifications() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const query = useQuery({
    enabled: !!user,
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(40);
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => qc.invalidateQueries({ queryKey: ["notifications", user.id] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, qc]);

  return query;
}

export function useMarkNotificationsRead() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!user) return;
      await supabase.from("notifications").update({ read_at: new Date().toISOString() })
        .is("read_at", null).eq("user_id", user.id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications", user?.id] }),
  });
}

export function useProfessionalReviews(handle: string) {
  return useQuery({
    queryKey: ["reviews", handle],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("professional_handle", handle)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSubmitReview() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { bookingId: string; handle: string; rating: number; comment: string }) => {
      if (!user) throw new Error("Sign in required");
      const { error } = await supabase.from("reviews").upsert(
        {
          booking_id: input.bookingId,
          customer_id: user.id,
          professional_handle: input.handle,
          rating: input.rating,
          comment: input.comment,
        },
        { onConflict: "booking_id,customer_id" },
      );
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["reviews", v.handle] });
      qc.invalidateQueries({ queryKey: ["myReviews"] });
    },
  });
}

export function useMyReviews() {
  const { user } = useAuth();
  return useQuery({
    enabled: !!user,
    queryKey: ["myReviews", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("customer_id", user!.id);
      if (error) throw error;
      return data ?? [];
    },
  });
}