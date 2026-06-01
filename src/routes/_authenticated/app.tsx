import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarCheck, MessagesSquare, ArrowUpRight, X, MessageSquare, Star, Sparkles } from "lucide-react";
import { DashShell } from "@/components/dash-shell";
import { useAuth } from "@/hooks/use-auth";
import { useBookings } from "@/hooks/use-customer-data";
import { formatINR } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ChatPanel } from "@/components/chat-panel";
import { useSubmitReview, useMyReviews } from "@/hooks/use-messaging";

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({ meta: [{ title: "Dashboard" }] }),
  component: CustomerDash,
});

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  confirmed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  in_progress: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  completed: "bg-primary/15 text-primary border-primary/30",
  cancelled: "bg-muted text-muted-foreground border-border",
};

function CustomerDash() {
  const { user } = useAuth();
  const { bookings, refresh: refreshBookings, loading: bLoading } = useBookings();
  const upcoming = bookings.filter((b) => b.status !== "completed" && b.status !== "cancelled");
  const { data: myReviews } = useMyReviews();
  const reviewedSet = new Set((myReviews ?? []).map((r) => r.booking_id));

  const cancel = async (id: string) => {
    const { error } = await supabase.from("bookings").update({ status: "cancelled" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Booking cancelled");
    refreshBookings();
  };

  return (
    <DashShell title={`Hi, ${user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "there"}`} subtitle="Your bookings and saved creators.">
      <div className="grid sm:grid-cols-3 gap-4">
        <Stat Icon={CalendarCheck} label="Active bookings" value={String(upcoming.length)} />
        <Stat Icon={Star} label="Completed" value={String(bookings.filter(b => b.status === "completed").length)} />
        <Stat Icon={MessagesSquare} label="Total bookings" value={String(bookings.length)} />
      </div>

      <section className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl">Your bookings</h2>
          <Link to="/marketplace" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            Find a creator <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {bLoading ? (
          <div className="rounded-xl border border-border bg-card/40 p-8 text-center text-muted-foreground">Loading…</div>
        ) : bookings.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/40 p-10 text-center">
            <Sparkles className="h-6 w-6 text-primary mx-auto" />
            <p className="text-foreground font-medium mt-3">No bookings yet</p>
            <p className="text-sm text-muted-foreground mt-1">Browse real verified creators and request a quote.</p>
            <Link to="/marketplace" className="inline-flex mt-5 items-center gap-1.5 rounded-md bg-[image:var(--gradient-gold)] text-primary-foreground px-4 py-2 text-sm font-medium">
              Browse marketplace <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {bookings.map((b) => (
              <div key={b.id} className="rounded-xl border border-border bg-card/60 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{b.professional_name}</div>
                    <div className="text-xs text-muted-foreground capitalize mt-0.5">{b.category}{b.city ? ` · ${b.city}` : ""}</div>
                  </div>
                  <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-md border ${STATUS_STYLES[b.status] ?? ""}`}>{b.status.replace("_", " ")}</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{b.event_date ? new Date(b.event_date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }) : "Date TBD"}</span>
                  <span>{b.budget_inr ? `${formatINR(b.budget_inr)}` : ""}</span>
                </div>
                {b.status !== "cancelled" && b.status !== "completed" && (
                  <div className="mt-3 flex items-center gap-3">
                    <ChatDialog bookingId={b.id} title={`Chat with ${b.professional_name}`} />
                    <button onClick={() => cancel(b.id)} className="text-xs text-muted-foreground hover:text-destructive inline-flex items-center gap-1">
                      <X className="h-3 w-3" /> Cancel
                    </button>
                  </div>
                )}
                {b.status === "completed" && !reviewedSet.has(b.id) && b.professional_handle && (
                  <div className="mt-3">
                    <ReviewDialog bookingId={b.id} handle={b.professional_handle} name={b.professional_name} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </DashShell>
  );
}

function Stat({ Icon, label, value }: { Icon: typeof CalendarCheck; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card/60 p-5">
      <Icon className="h-5 w-5 text-primary" />
      <div className="text-2xl font-display mt-3">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

function ChatDialog({ bookingId, title }: { bookingId: string; title: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1">
          <MessageSquare className="h-3 w-3" /> Message
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <ChatPanel bookingId={bookingId} />
      </DialogContent>
    </Dialog>
  );
}

function ReviewDialog({ bookingId, handle, name }: { bookingId: string; handle: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const submit = useSubmitReview();
  const save = () => {
    submit.mutate({ bookingId, handle, rating, comment }, {
      onSuccess: () => { toast.success("Thanks for your review"); setOpen(false); },
      onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
    });
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="text-xs text-primary inline-flex items-center gap-1 hover:underline">
          <Star className="h-3 w-3" /> Leave a review
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Review {name}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-1">
            {[1,2,3,4,5].map((n) => (
              <button key={n} onClick={() => setRating(n)} aria-label={`${n} stars`}>
                <Star className={`h-7 w-7 ${n <= rating ? "fill-primary text-primary" : "text-muted-foreground"}`} />
              </button>
            ))}
          </div>
          <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share details about your experience…" rows={4} />
          <Button onClick={save} disabled={submit.isPending} className="w-full">{submit.isPending ? "Submitting…" : "Submit review"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}