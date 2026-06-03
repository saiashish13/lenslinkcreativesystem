import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowUpRight, Camera, Search, MapPin, ShieldCheck, Video, Scissors, Sparkles } from "lucide-react";
import { useState } from "react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "Find trusted photographers, videographers & editors near you" },
      { name: "description", content: "Real verified photographers, videographers and editors across India. Transparent pricing, real reviews, no fake listings." },
    ],
  }),
});

function Landing() {
  return (
    <main className="min-h-screen">
      <SiteNav />
      <Hero />
      <Categories />
      <HowItWorks />
      <ForCreators />
      <SiteFooter />
    </main>
  );
}

function Hero() {
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [cat, setCat] = useState<"all" | "photographer" | "videographer" | "editor">("all");
  const navigate = useNavigate();
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/marketplace", search: { q, city, category: cat, budget: "any", minRating: 0, sort: "price_asc" } });
  };
  return (
    <section className="relative pt-32 pb-20">
      <div className="max-w-5xl mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground mb-6">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Real businesses · Verified profiles · No fake listings
        </div>
        <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[0.98] tracking-tight">
          Find trusted photographers, videographers & editors <span className="text-gradient-gold">near you</span>.
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
          Discover real creators across India sourced from public business directories and verified through claim-based onboarding. Affordable options first.
        </p>

        <form onSubmit={submit} className="mt-10 grid sm:grid-cols-[1fr_1fr_auto_auto] gap-2 max-w-3xl mx-auto p-2 rounded-2xl border border-border bg-card/60 backdrop-blur">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Wedding, fashion, drone…" className="w-full pl-10 pr-3 py-3 rounded-md bg-background border border-border text-sm" />
          </div>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Any city" className="w-full pl-10 pr-3 py-3 rounded-md bg-background border border-border text-sm" />
          </div>
          <select value={cat} onChange={(e) => setCat(e.target.value as typeof cat)} className="rounded-md bg-background border border-border px-3 py-3 text-sm">
            <option value="all">All roles</option>
            <option value="photographer">Photographer</option>
            <option value="videographer">Videographer</option>
            <option value="editor">Editor</option>
          </select>
          <button className="rounded-md bg-[image:var(--gradient-gold)] text-primary-foreground px-5 py-3 text-sm font-medium inline-flex items-center gap-1.5">
            Search <ArrowUpRight className="h-4 w-4" />
          </button>
        </form>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
          {["Mumbai", "Bengaluru", "Delhi", "Hyderabad", "Pune", "Goa", "Jaipur", "Chennai"].map((c) => (
            <Link key={c} to="/marketplace" search={{ q: "", city: c, category: "all", budget: "any", minRating: 0, sort: "price_asc" }} className="rounded-full border border-border bg-background px-3 py-1 hover:border-primary/40 hover:text-foreground transition">
              {c}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

const CATEGORIES = [
  { Icon: Camera, key: "photographer" as const, title: "Photographers", desc: "Wedding, fashion, portrait, product, real estate, food, travel and more." },
  { Icon: Video, key: "videographer" as const, title: "Videographers", desc: "Weddings, corporate, documentary, YouTube, commercial and drone." },
  { Icon: Scissors, key: "editor" as const, title: "Editors", desc: "Photo retouching, color grading, video editing and motion graphics." },
];
function Categories() {
  return (
    <section className="py-20 border-t border-border/60">
      <div className="max-w-7xl mx-auto px-6">
        <div className="max-w-2xl mb-12">
          <p className="text-xs uppercase tracking-[0.2em] text-primary mb-3">Browse by role</p>
          <h2 className="font-display text-4xl tracking-tight">Real creators across every craft.</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {CATEGORIES.map((c) => (
            <Link key={c.key} to="/marketplace" search={{ q: "", city: "", category: c.key, budget: "any", minRating: 0, sort: "price_asc" }} className="group rounded-2xl border border-border bg-card p-6 hover:border-primary/30 transition">
              <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 grid place-items-center mb-4">
                <c.Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="font-display text-xl">{c.title}</div>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{c.desc}</p>
              <div className="mt-5 text-sm text-primary inline-flex items-center gap-1">Browse <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 transition" /></div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { k: "01", t: "Search & filter", b: "By location, budget, category, rating. Affordable creators surface first." },
    { k: "02", t: "Compare real profiles", b: "Real portfolios, real Google reviews, real contact details. No stock images." },
    { k: "03", t: "Request a quote", b: "Reach out directly, chat, agree on price, schedule the shoot." },
    { k: "04", t: "Book & review", b: "Confirm the booking, get your files, leave a verified review." },
  ];
  return (
    <section className="py-20 border-t border-border/60">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-4">
          <p className="text-xs uppercase tracking-[0.2em] text-primary mb-3">How it works</p>
          <h2 className="font-display text-4xl tracking-tight">From search to shoot, transparent end-to-end.</h2>
        </div>
        <ol className="lg:col-span-8 grid sm:grid-cols-2 gap-px bg-border/60 rounded-2xl overflow-hidden border border-border">
          {steps.map((s) => (
            <li key={s.k} className="bg-card p-7">
              <div className="text-primary font-display text-2xl">{s.k}</div>
              <div className="mt-3 text-lg font-medium">{s.t}</div>
              <p className="mt-2 text-sm text-muted-foreground">{s.b}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function ForCreators() {
  return (
    <section className="py-24 border-t border-border/60">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <Sparkles className="h-6 w-6 text-primary mx-auto" />
        <h2 className="font-display text-4xl tracking-tight mt-4">Are you a photographer, videographer or editor?</h2>
        <p className="mt-4 text-muted-foreground">List your business, claim your existing Google profile, and get discovered by clients in your city — all free to join.</p>
        <div className="mt-7 flex flex-wrap items-center gap-2 justify-center">
          <Link to="/signup" className="inline-flex items-center gap-1.5 rounded-md bg-[image:var(--gradient-gold)] text-primary-foreground px-5 py-3 text-sm font-medium">
            Create your listing <ArrowUpRight className="h-4 w-4" />
          </Link>
          <Link to="/marketplace" className="inline-flex items-center gap-1.5 rounded-md border border-border px-5 py-3 text-sm hover:bg-card transition">
            Browse the marketplace
          </Link>
        </div>
      </div>
    </section>
  );
}