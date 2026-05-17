import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { CalendarPlus, Check, ImagePlus, IndianRupee, Loader2, Plus, Sparkles, Trash2, Wand2, X } from "lucide-react";
import { DashShell } from "@/components/dash-shell";
import { useAuth } from "@/hooks/use-auth";
import {
  useIncomingBookings,
  usePackages,
  usePortfolio,
  useSlots,
} from "@/hooks/use-creator-data";
import { supabase } from "@/integrations/supabase/client";
import { formatINR } from "@/lib/format";
import { generateCaption, suggestPricing } from "@/lib/creator-ai.functions";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/pro")({
  head: () => ({ meta: [{ title: "Creator dashboard — LensLink AI" }] }),
  component: ProDash,
});

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  confirmed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  in_progress: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  completed: "bg-primary/15 text-primary border-primary/30",
  cancelled: "bg-muted text-muted-foreground border-border",
};

function ProDash() {
  const { user } = useAuth();
  return (
    <DashShell
      title={`Creator studio`}
      subtitle={`Welcome back${user?.email ? `, ${user.email.split("@")[0]}` : ""}. Manage bookings, availability, and your portfolio.`}
    >
      <Tabs defaultValue="bookings">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full bg-card/60">
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="packages">Packages</TabsTrigger>
          <TabsTrigger value="ai">AI tools</TabsTrigger>
        </TabsList>
        <TabsContent value="bookings" className="mt-6"><BookingsTab /></TabsContent>
        <TabsContent value="availability" className="mt-6"><AvailabilityTab /></TabsContent>
        <TabsContent value="portfolio" className="mt-6"><PortfolioTab /></TabsContent>
        <TabsContent value="packages" className="mt-6"><PackagesTab /></TabsContent>
        <TabsContent value="ai" className="mt-6"><AIToolsTab /></TabsContent>
      </Tabs>
    </DashShell>
  );
}

function BookingsTab() {
  const { bookings, loading, refresh } = useIncomingBookings();
  const update = async (id: string, status: "confirmed" | "in_progress" | "completed" | "cancelled") => {
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Booking ${status.replace("_", " ")}`);
    refresh();
  };
  if (loading) return <Empty>Loading…</Empty>;
  if (bookings.length === 0) {
    return <Empty>No incoming bookings yet. Share your profile to get discovered.</Empty>;
  }
  return (
    <div className="grid md:grid-cols-2 gap-3">
      {bookings.map((b) => (
        <div key={b.id} className="rounded-xl border border-border bg-card/60 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-medium">{b.category} · {b.city ?? "—"}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {b.event_date ? new Date(b.event_date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" }) : "No date set"}
              </div>
            </div>
            <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-md border ${STATUS_STYLES[b.status] ?? ""}`}>
              {b.status.replace("_", " ")}
            </span>
          </div>
          {b.requirements && <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{b.requirements}</p>}
          <div className="mt-3 text-sm font-display">{b.budget_inr ? `${formatINR(b.budget_inr)} budget` : "Budget not specified"}</div>
          <div className="mt-4 flex flex-wrap gap-2">
            {b.status === "pending" && (
              <>
                <button onClick={() => update(b.id, "confirmed")} className="inline-flex items-center gap-1 text-xs rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 hover:bg-emerald-500/25">
                  <Check className="h-3 w-3" /> Accept
                </button>
                <button onClick={() => update(b.id, "cancelled")} className="inline-flex items-center gap-1 text-xs rounded-md border border-border text-muted-foreground px-3 py-1.5 hover:text-destructive">
                  <X className="h-3 w-3" /> Decline
                </button>
              </>
            )}
            {b.status === "confirmed" && (
              <button onClick={() => update(b.id, "in_progress")} className="text-xs rounded-md bg-blue-500/15 text-blue-400 border border-blue-500/30 px-3 py-1.5 hover:bg-blue-500/25">
                Start project
              </button>
            )}
            {b.status === "in_progress" && (
              <button onClick={() => update(b.id, "completed")} className="text-xs rounded-md bg-primary/15 text-primary border border-primary/30 px-3 py-1.5 hover:bg-primary/25">
                Mark complete
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function AvailabilityTab() {
  const { user } = useAuth();
  const { slots, loading, refresh } = useSlots();
  const [date, setDate] = useState("");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("18:00");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const add = async () => {
    if (!user || !date) return toast.error("Pick a date");
    setBusy(true);
    const { error } = await supabase.from("availability_slots").insert({
      creator_id: user.id, slot_date: date, start_time: start, end_time: end, note: note || null,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    setDate(""); setNote("");
    toast.success("Slot added");
    refresh();
  };

  const remove = async (id: string) => {
    await supabase.from("availability_slots").delete().eq("id", id);
    refresh();
  };

  return (
    <div className="grid md:grid-cols-[1fr_2fr] gap-6">
      <div className="rounded-xl border border-border bg-card/60 p-5 space-y-3 h-fit">
        <div className="flex items-center gap-2 text-sm font-medium"><CalendarPlus className="h-4 w-4 text-primary" /> Add availability</div>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} min={new Date().toISOString().slice(0,10)} className="w-full rounded-md bg-background border border-border px-3 py-2 text-sm" />
        <div className="grid grid-cols-2 gap-2">
          <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className="rounded-md bg-background border border-border px-3 py-2 text-sm" />
          <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className="rounded-md bg-background border border-border px-3 py-2 text-sm" />
        </div>
        <input placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} className="w-full rounded-md bg-background border border-border px-3 py-2 text-sm" />
        <button onClick={add} disabled={busy || !date} className="w-full inline-flex items-center justify-center gap-1.5 rounded-md bg-[image:var(--gradient-gold)] text-primary-foreground px-4 py-2 text-sm font-medium disabled:opacity-40">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add slot
        </button>
      </div>
      <div>
        {loading ? <Empty>Loading…</Empty> : slots.length === 0 ? (
          <Empty>No upcoming slots. Add availability so clients can book you.</Empty>
        ) : (
          <div className="space-y-2">
            {slots.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-xl border border-border bg-card/60 p-4">
                <div>
                  <div className="font-medium text-sm">{new Date(s.slot_date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
                  <div className="text-xs text-muted-foreground">{s.start_time.slice(0,5)} – {s.end_time.slice(0,5)}{s.note ? ` · ${s.note}` : ""}</div>
                </div>
                <div className="flex items-center gap-2">
                  {s.is_booked && <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-md border bg-emerald-500/15 text-emerald-400 border-emerald-500/30">Booked</span>}
                  <button onClick={() => remove(s.id)} className="text-muted-foreground hover:text-destructive p-1.5"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PortfolioTab() {
  const { user } = useAuth();
  const { items, loading, refresh } = usePortfolio();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const upload = async () => {
    if (!user || !file || !title.trim()) return toast.error("Add a title and select an image");
    setBusy(true);
    const path = `${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error: upErr } = await supabase.storage.from("portfolio").upload(path, file);
    if (upErr) { setBusy(false); return toast.error(upErr.message); }
    const { data: pub } = supabase.storage.from("portfolio").getPublicUrl(path);
    const tagArr = tags.split(",").map((t) => t.trim()).filter(Boolean);
    const { error } = await supabase.from("portfolio_items").insert({
      creator_id: user.id, title, description: description || null, media_url: pub.publicUrl, tags: tagArr,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    setTitle(""); setDescription(""); setTags(""); setFile(null);
    toast.success("Added to portfolio");
    refresh();
  };

  const remove = async (id: string) => {
    await supabase.from("portfolio_items").delete().eq("id", id);
    refresh();
  };

  return (
    <div className="grid md:grid-cols-[1fr_2fr] gap-6">
      <div className="rounded-xl border border-border bg-card/60 p-5 space-y-3 h-fit">
        <div className="flex items-center gap-2 text-sm font-medium"><ImagePlus className="h-4 w-4 text-primary" /> Upload work</div>
        <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-md bg-background border border-border px-3 py-2 text-sm" />
        <textarea placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full rounded-md bg-background border border-border px-3 py-2 text-sm" />
        <input placeholder="Tags, comma separated" value={tags} onChange={(e) => setTags(e.target.value)} className="w-full rounded-md bg-background border border-border px-3 py-2 text-sm" />
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="w-full text-xs text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:text-secondary-foreground" />
        <button onClick={upload} disabled={busy || !file || !title.trim()} className="w-full inline-flex items-center justify-center gap-1.5 rounded-md bg-[image:var(--gradient-gold)] text-primary-foreground px-4 py-2 text-sm font-medium disabled:opacity-40">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Upload
        </button>
      </div>
      <div>
        {loading ? <Empty>Loading…</Empty> : items.length === 0 ? (
          <Empty>No portfolio items yet. Upload your best work to attract clients.</Empty>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {items.map((it) => (
              <div key={it.id} className="rounded-xl border border-border bg-card overflow-hidden group relative">
                <img src={it.media_url} alt={it.title} className="w-full h-48 object-cover" />
                <div className="p-3">
                  <div className="font-medium text-sm">{it.title}</div>
                  {it.description && <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{it.description}</div>}
                  {it.tags && it.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {it.tags.map((t) => <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{t}</span>)}
                    </div>
                  )}
                </div>
                <button onClick={() => remove(it.id)} className="absolute top-2 right-2 p-1.5 rounded-md bg-background/80 backdrop-blur opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PackagesTab() {
  const { user } = useAuth();
  const { packages, loading, refresh } = usePackages();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number>(15000);
  const [days, setDays] = useState<number>(7);
  const [busy, setBusy] = useState(false);

  const add = async () => {
    if (!user || !title.trim() || price <= 0) return toast.error("Fill title and price");
    setBusy(true);
    const { error } = await supabase.from("pricing_packages").insert({
      creator_id: user.id, title, description: description || null, price_inr: price, delivery_days: days,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    setTitle(""); setDescription(""); setPrice(15000); setDays(7);
    toast.success("Package added");
    refresh();
  };

  const remove = async (id: string) => {
    await supabase.from("pricing_packages").delete().eq("id", id);
    refresh();
  };

  return (
    <div className="grid md:grid-cols-[1fr_2fr] gap-6">
      <div className="rounded-xl border border-border bg-card/60 p-5 space-y-3 h-fit">
        <div className="flex items-center gap-2 text-sm font-medium"><IndianRupee className="h-4 w-4 text-primary" /> Add package</div>
        <input placeholder="Title (e.g. Wedding half-day)" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-md bg-background border border-border px-3 py-2 text-sm" />
        <textarea placeholder="What's included" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full rounded-md bg-background border border-border px-3 py-2 text-sm" />
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs text-muted-foreground">Price (₹)
            <input type="number" min={0} value={price} onChange={(e) => setPrice(Number(e.target.value))} className="mt-1 w-full rounded-md bg-background border border-border px-3 py-2 text-sm" />
          </label>
          <label className="text-xs text-muted-foreground">Delivery (days)
            <input type="number" min={1} value={days} onChange={(e) => setDays(Number(e.target.value))} className="mt-1 w-full rounded-md bg-background border border-border px-3 py-2 text-sm" />
          </label>
        </div>
        <button onClick={add} disabled={busy || !title.trim()} className="w-full inline-flex items-center justify-center gap-1.5 rounded-md bg-[image:var(--gradient-gold)] text-primary-foreground px-4 py-2 text-sm font-medium disabled:opacity-40">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add
        </button>
      </div>
      <div>
        {loading ? <Empty>Loading…</Empty> : packages.length === 0 ? (
          <Empty>Create packages so clients can book at a fixed price.</Empty>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {packages.map((p) => (
              <div key={p.id} className="rounded-xl border border-border bg-card/60 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="font-medium">{p.title}</div>
                  <button onClick={() => remove(p.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </div>
                {p.description && <div className="text-xs text-muted-foreground mt-1">{p.description}</div>}
                <div className="mt-3 flex items-baseline gap-2">
                  <div className="font-display text-2xl">{formatINR(p.price_inr)}</div>
                  <div className="text-xs text-muted-foreground">· {p.delivery_days} day delivery</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AIToolsTab() {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <CaptionTool />
      <PricingTool />
    </div>
  );
}

function CaptionTool() {
  const fn = useServerFn(generateCaption);
  const [context, setContext] = useState("");
  const [tone, setTone] = useState<"editorial" | "fun" | "luxury" | "minimal">("editorial");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ caption: string; hashtags: string[] } | null>(null);

  const run = async () => {
    if (context.trim().length < 3) return;
    setLoading(true);
    try {
      const r = await fn({ data: { context, tone } });
      setResult(r);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="rounded-2xl border border-primary/20 bg-card/60 p-5">
      <div className="flex items-center gap-2 text-primary mb-2"><Sparkles className="h-4 w-4" /><span className="text-xs uppercase tracking-widest">Caption generator</span></div>
      <h3 className="font-display text-lg">Instagram captions & hashtags</h3>
      <textarea value={context} onChange={(e) => setContext(e.target.value)} rows={3} placeholder="Describe the shoot…" className="w-full mt-3 rounded-md bg-background border border-border px-3 py-2 text-sm" maxLength={500} />
      <div className="mt-2 flex items-center gap-2">
        <select value={tone} onChange={(e) => setTone(e.target.value as typeof tone)} className="rounded-md bg-background border border-border px-3 py-2 text-sm">
          <option value="editorial">Editorial</option>
          <option value="fun">Fun</option>
          <option value="luxury">Luxury</option>
          <option value="minimal">Minimal</option>
        </select>
        <button onClick={run} disabled={loading || context.trim().length < 3} className="ml-auto inline-flex items-center gap-1.5 rounded-md bg-[image:var(--gradient-gold)] text-primary-foreground px-4 py-2 text-sm font-medium disabled:opacity-40">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} Generate
        </button>
      </div>
      {result && (
        <div className="mt-4 space-y-3">
          <p className="text-sm leading-relaxed bg-background/50 rounded-md p-3 border border-border">{result.caption}</p>
          <div className="flex flex-wrap gap-1.5">
            {result.hashtags.map((h) => <span key={h} className="text-xs px-2 py-1 rounded-md bg-secondary text-secondary-foreground">{h}</span>)}
          </div>
        </div>
      )}
    </div>
  );
}

function PricingTool() {
  const fn = useServerFn(suggestPricing);
  const [category, setCategory] = useState("photographer");
  const [city, setCity] = useState("Mumbai");
  const [exp, setExp] = useState(5);
  const [specialty, setSpecialty] = useState("Wedding · Cinematic");
  const [loading, setLoading] = useState(false);
  const [r, setR] = useState<{ hourly_inr: number; half_day_inr: number; full_day_inr: number; rationale: string } | null>(null);

  const run = async () => {
    setLoading(true);
    try {
      const result = await fn({ data: { category, city, experience_years: exp, specialty } });
      setR(result);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="rounded-2xl border border-primary/20 bg-card/60 p-5">
      <div className="flex items-center gap-2 text-primary mb-2"><Sparkles className="h-4 w-4" /><span className="text-xs uppercase tracking-widest">Pricing assistant</span></div>
      <h3 className="font-display text-lg">Suggest market rates (INR)</h3>
      <div className="grid grid-cols-2 gap-2 mt-3">
        <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" className="rounded-md bg-background border border-border px-3 py-2 text-sm" />
        <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="rounded-md bg-background border border-border px-3 py-2 text-sm" />
        <input type="number" value={exp} onChange={(e) => setExp(Number(e.target.value))} placeholder="Years exp" className="rounded-md bg-background border border-border px-3 py-2 text-sm" />
        <input value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="Specialty" className="rounded-md bg-background border border-border px-3 py-2 text-sm" />
      </div>
      <button onClick={run} disabled={loading} className="mt-3 w-full inline-flex items-center justify-center gap-1.5 rounded-md bg-[image:var(--gradient-gold)] text-primary-foreground px-4 py-2 text-sm font-medium disabled:opacity-40">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} Suggest pricing
      </button>
      {r && (
        <div className="mt-4 space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <Rate label="Hourly" value={r.hourly_inr} />
            <Rate label="Half day" value={r.half_day_inr} />
            <Rate label="Full day" value={r.full_day_inr} />
          </div>
          {r.rationale && <p className="text-xs text-muted-foreground leading-relaxed">{r.rationale}</p>}
        </div>
      )}
    </div>
  );
}

function Rate({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border bg-background/50 p-3 text-center">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="font-display text-lg mt-1">{value ? formatINR(value) : "—"}</div>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-border bg-card/40 p-8 text-center text-muted-foreground">{children}</div>;
}
