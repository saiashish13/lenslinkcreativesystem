import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { ShieldCheck, Search, MapPin, Sparkles, Users, Zap } from "lucide-react";

export const Route = createFileRoute("/platform")({
  component: PlatformPage,
  head: () => ({
    meta: [
      { title: "The LensLink Platform — Real creators, verified listings, transparent bookings" },
      { name: "description", content: "How LensLink connects clients with real photographers, videographers, and editors across India — with verified profiles, geo discovery, and end-to-end booking tools." },
      { property: "og:title", content: "The LensLink Platform" },
      { property: "og:description", content: "Real creators, verified listings, transparent bookings." },
    ],
  }),
});

function PlatformPage() {
  const features = [
    { Icon: ShieldCheck, t: "Verified listings", b: "Every creator is either self-onboarded or claimed from a public Google Business profile with owner verification." },
    { Icon: Search, t: "Real search", b: "Filter by category, city, budget, rating and radius. Affordable creators surface first — no paid ranking." },
    { Icon: MapPin, t: "Geo discovery", b: "Interactive map, live radius filtering, and remembered location preferences across sessions." },
    { Icon: Users, t: "Role-based studios", b: "Separate workspaces for customers, creators, editors, and admins — each with the exact tools they need." },
    { Icon: Zap, t: "AI assistance", b: "AI recommendations, pricing coach and caption generator — all powered by the Lovable AI gateway." },
    { Icon: Sparkles, t: "End-to-end bookings", b: "Chat, availability, revisions, delivery and reviews all live in one place." },
  ];
  return (
    <main className="min-h-screen">
      <SiteNav />
      <section className="pt-32 pb-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-primary mb-3">The Platform</p>
          <h1 className="font-display text-5xl lg:text-6xl tracking-tight">Everything you need to <span className="text-gradient-gold">book real creators</span>.</h1>
          <p className="mt-6 text-lg text-muted-foreground">LensLink is a full marketplace and workflow platform for photographers, videographers and editors across India — plus the clients and editors they work with.</p>
        </div>
      </section>
      <section className="pb-24">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <div key={f.t} className="rounded-2xl border border-border bg-card p-6">
              <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 grid place-items-center mb-4">
                <f.Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="font-display text-xl">{f.t}</div>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{f.b}</p>
            </div>
          ))}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}