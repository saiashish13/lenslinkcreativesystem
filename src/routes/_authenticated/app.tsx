import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { CalendarCheck, Heart, MessagesSquare, Sparkles, MapPin, Star, Loader2, ArrowUpRight, X, MessageSquare } from "lucide-react";
import { DashShell } from "@/components/dash-shell";
import { useAuth } from "@/hooks/use-auth";
import { useBookings, useFavorites } from "@/hooks/use-customer-data";
import { PROFESSIONALS, getProfessional } from "@/lib/professionals";
import { formatINR } from "@/lib/format";
import { recommendCreators } from "@/lib/recommend.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ChatPanel } from "@/components/chat-panel";
import { useSubmitReview, useMyReviews } from "@/hooks/use-messaging";

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({ meta: [{ title: "Dashboard — LensLink AI" }] }),
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
  const { handles: favHandles, toggle } = useFavorites();
  const favorites = favHandles.map(getProfessional).filter(Boolean) as ReturnType<typeof getProfessional>[];

  const upcoming = bookings.filter((b) => b.status !== "completed" && b.status !== "cancelled");
  const { data: myReviews } = useMyReviews();
  const reviewedSet = new Set((myReviews ?? []).map((r) => r.booking_id));

  const cancel = async (id: string) => {
    const { error } = await supabase.from("bookings").update({ status: "cancelled" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Booking cancelled");
    refreshBookings();
  };

  const cards = [
    { Icon: CalendarCheck, label: "Active bookings", value: String(upcoming.length) },
    { Icon: Heart, label: "Saved creators", value: String(favHandles.length) },
    { Icon: MessagesSquare, label: "Messages", value: "0" },
    { Icon: Sparkles, label: "AI matches", value: "→" },
  ];

  return (
    <DashShell title={`Hi, ${user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "there"}`} subtitle="Your creative projects, all in one place.">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-border bg-card/60 p-5">
            <c.Icon className="h-5 w-5 text-primary" />
            <div className="text-2xl font-display mt-3">{c.value}</div>
            <div className="text-sm text-muted-foreground">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Bookings */}
      <section className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl">Your bookings</h2>
          <Link to="/marketplace" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            New booking <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {bLoading ? (
          <div className="rounded-xl border border-border bg-card/40 p-8 text-center text-muted-foreground">Loading…</div>
        ) : bookings.length === 0 ? (
          <div className="rounded-xl border border-border bg-card/40 p-8 text-center">
            <p className="text-muted-foreground">No bookings yet. Browse creators to make your first one.</p>
            <Link to="/marketplace" className="inline-flex mt-4 items-center gap-1.5 rounded-md bg-[image:var(--gradient-gold)] text-primary-foreground px-4 py-2 text-sm font-medium">
              Browse marketplace
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {bookings.map((b) => (
              <div key={b.id} className="rounded-xl border border-border bg-card/60 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link to="/creators/$handle" params={{ handle: b.professional_handle }} className="font-medium hover:text-primary transition">
                      {b.professional_name}
                    </Link>
                    <div className="text-xs text-muted-foreground capitalize mt-0.5">{b.category} · {b.city}</div>
                  </div>
                  <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-md border ${STATUS_STYLES[b.status] ?? ""}`}>
                    {b.status.replace("_", " ")}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{b.event_date ? new Date(b.event_date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }) : "—"}</span>
                  <span>{b.budget_inr ? `${formatINR(b.budget_inr)} budget` : ""}</span>
                </div>
                {b.status !== "cancelled" && b.status !== "completed" && (
                  <div className="mt-3 flex items-center gap-3">
                    <ChatDialog bookingId={b.id} title={`Chat with ${b.professional_name}`} />
                    <button onClick={() => cancel(b.id)} className="text-xs text-muted-foreground hover:text-destructive inline-flex items-center gap-1">
                      <X className="h-3 w-3" /> Cancel
                    </button>
                  </div>
                )}
                {b.status === "completed" && !reviewedSet.has(b.id) && (
                  <div className="mt-3">
                    <ReviewDialog bookingId={b.id} handle={b.professional_handle} name={b.professional_name} />
                  </div>
                )}
                {b.status === "completed" && reviewedSet.has(b.id) && (
                  <div className="mt-3 text-xs text-muted-foreground inline-flex items-center gap-1">
                    <Star className="h-3 w-3 fill-primary text-primary" /> Review submitted
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Favorites */}
      <section className="mt-10">
        <h2 className="font-display text-xl mb-4">Saved creators</h2>
        {favorites.length === 0 ? (
          <div className="rounded-xl border border-border bg-card/40 p-8 text-center text-muted-foreground">
            Tap the heart on any creator card to save them here.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {favorites.map((p) => (
              <div key={p!.id} className="rounded-xl border border-border bg-card overflow-hidden flex">
                <img src={p!.image} alt={p!.name} className="h-24 w-24 object-cover" />
                <div className="flex-1 p-3 min-w-0">
                  <Link to="/creators/$handle" params={{ handle: p!.handle }} className="font-medium text-sm hover:text-primary transition truncate block">{p!.name}</Link>
                  <div className="text-xs text-muted-foreground truncate">{p!.specialty}</div>
                  <div className="mt-1 flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1 text-muted-foreground"><MapPin className="h-3 w-3" />{p!.city}</span>
                    <span className="font-display">{formatINR(p!.hourly)}<span className="text-muted-foreground text-[10px]">/hr</span></span>
                  </div>
                </div>
                <button onClick={() => toggle(p!.handle)} aria-label="Remove" className="px-3 text-muted-foreground hover:text-destructive">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* AI recommendations */}
      <AIPanel />
    </DashShell>
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
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
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
    submit.mutate(
      { bookingId, handle, rating, comment },
      {
        onSuccess: () => { toast.success("Thanks for your review"); setOpen(false); },
        onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="text-xs text-primary inline-flex items-center gap-1 hover:underline">
          <Star className="h-3 w-3" /> Leave a review
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Review {name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setRating(n)} aria-label={`${n} stars`}>
                <Star className={`h-7 w-7 ${n <= rating ? "fill-primary text-primary" : "text-muted-foreground"}`} />
              </button>
            ))}
          </div>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share details about your experience…"
            rows={4}
          />
          <Button onClick={save} disabled={submit.isPending} className="w-full">
            {submit.isPending ? "Submitting…" : "Submit review"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AIPanel() {
  const recommend = useServerFn(recommendCreators);
  const [brief, setBrief] = useState("");
  const [loading, setLoading] = useState(false);
  const [picks, setPicks] = useState<{ handle: string; reason: string }[]>([]);

  const run = async () => {
    if (brief.trim().length < 3) return;
    setLoading(true);
    try {
      const result = await recommend({
        data: {
          brief,
          professionals: PROFESSIONALS.map((p) => ({
            handle: p.handle, name: p.name, category: p.category, specialty: p.specialty,
            city: p.city, hourly: p.hourly, rating: p.rating, languages: p.languages,
          })),
        },
      });
      setPicks(result.picks);
      if (result.picks.length === 0) toast("No strong matches — try a more specific brief.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to get recommendations");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mt-10">
      <div className="rounded-2xl border border-primary/20 bg-[image:var(--gradient-gold)]/5 p-6">
        <div className="flex items-center gap-2 text-primary mb-2">
          <Sparkles className="h-4 w-4" />
          <span className="text-xs uppercase tracking-widest">AI recommendations</span>
        </div>
        <h2 className="font-display text-2xl">Describe your shoot — we'll match the right creators</h2>
        <p className="text-sm text-muted-foreground mt-1">e.g. "2-day Hindu wedding in Udaipur, cinematic style, ₹2L budget"</p>

        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <input
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && run()}
            placeholder="Brief your project…"
            className="flex-1 rounded-md bg-background border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            maxLength={800}
          />
          <button
            onClick={run}
            disabled={loading || brief.trim().length < 3}
            className="inline-flex items-center justify-center gap-1.5 rounded-md bg-[image:var(--gradient-gold)] text-primary-foreground px-5 py-2.5 text-sm font-medium disabled:opacity-40"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Find matches
          </button>
        </div>

        {picks.length > 0 && (
          <div className="mt-6 grid md:grid-cols-3 gap-3">
            {picks.map((pick) => {
              const p = getProfessional(pick.handle);
              if (!p) return null;
              return (
                <Link key={pick.handle} to="/creators/$handle" params={{ handle: p.handle }} className="rounded-xl border border-border bg-card p-4 hover:border-primary/50 transition">
                  <div className="flex items-center gap-3">
                    <img src={p.image} alt={p.name} className="h-12 w-12 rounded-lg object-cover" />
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">{p.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{p.city} · {formatINR(p.hourly)}/hr</div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3 leading-relaxed">{pick.reason}</p>
                  <div className="mt-3 text-xs inline-flex items-center gap-1 text-primary">
                    <Star className="h-3 w-3 fill-primary" /> {p.rating.toFixed(1)} · {p.reviews} reviews
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}