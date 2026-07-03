import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { Check, ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/pricing")({
  component: PricingPage,
  head: () => ({
    meta: [
      { title: "Pricing — Free to join, transparent commission" },
      { name: "description", content: "LensLink is free for clients and free for creators to list. A small platform fee applies only on successful bookings." },
      { property: "og:title", content: "LensLink Pricing" },
      { property: "og:description", content: "Free to join. Small commission only on successful bookings." },
    ],
  }),
});

function PricingPage() {
  const tiers = [
    {
      name: "Client",
      price: "Free",
      desc: "Discover and book verified creators near you.",
      features: ["Unlimited search & discovery", "Direct chat with creators", "Booking management & reviews", "AI recommendations"],
      cta: { label: "Start browsing", to: "/marketplace" as const },
    },
    {
      name: "Creator",
      price: "Free to list",
      desc: "List your business or claim your existing Google profile.",
      features: ["Public verified profile", "Portfolio, packages & availability", "Direct client bookings", "15% commission on completed bookings only"],
      cta: { label: "List your business", to: "/signup" as const },
      featured: true,
    },
    {
      name: "Editor",
      price: "Free",
      desc: "Claim projects from creators and deliver revisions.",
      features: ["Project pool access", "Versioned file delivery", "Revision threads", "Paid per completed project"],
      cta: { label: "Join as editor", to: "/signup" as const },
    },
  ];
  return (
    <main className="min-h-screen">
      <SiteNav />
      <section className="pt-32 pb-12">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-primary mb-3">Pricing</p>
          <h1 className="font-display text-5xl lg:text-6xl tracking-tight">Free to join. <span className="text-gradient-gold">Transparent</span> commission.</h1>
          <p className="mt-6 text-lg text-muted-foreground">No listing fees. No lead fees. We only take a small platform fee when a booking is successfully completed.</p>
        </div>
      </section>
      <section className="pb-24">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-4">
          {tiers.map((t) => (
            <div key={t.name} className={`rounded-2xl border p-6 flex flex-col ${t.featured ? "border-primary/50 bg-card shadow-[var(--shadow-gold)]" : "border-border bg-card"}`}>
              <div className="font-display text-2xl">{t.name}</div>
              <div className="mt-2 font-display text-4xl text-gradient-gold">{t.price}</div>
              <p className="mt-2 text-sm text-muted-foreground">{t.desc}</p>
              <ul className="mt-5 space-y-2 text-sm flex-1">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" /> <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link to={t.cta.to} className="mt-6 inline-flex items-center justify-center gap-1.5 rounded-md bg-[image:var(--gradient-gold)] text-primary-foreground px-4 py-2.5 text-sm font-medium">
                {t.cta.label} <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}