import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, ArrowUpRight, Sparkles } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/pricing")({
  component: PricingPage,
  head: () => ({
    meta: [
      { title: "Pricing — LensLink.AI" },
      { name: "description", content: "Simple, transparent pricing for customers and creators on LensLink.AI." },
      { property: "og:title", content: "Pricing — LensLink.AI" },
      { property: "og:description", content: "Simple, transparent pricing for customers and creators on LensLink.AI." },
    ],
  }),
});

const CUSTOMER_TIERS = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    desc: "Browse, message & book creators at no cost.",
    features: [
      "Unlimited marketplace browsing",
      "Direct messaging with creators",
      "Request unlimited quotes",
      "Verified review system",
      "Saved shortlists",
    ],
    cta: "Get started",
    href: "/signup",
    featured: false,
  },
  {
    name: "Pro",
    price: "₹999",
    period: "/month",
    desc: "Priority access, dedicated support & AI-assisted briefs.",
    features: [
      "Everything in Free",
      "Priority creator matching",
      "AI shoot brief generator",
      "Dedicated account manager",
      "Instant booking confirmations",
      "Advanced filters & sorting",
    ],
    cta: "Start Pro trial",
    href: "/signup",
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "Bulk bookings, white-label & API access for teams.",
    features: [
      "Everything in Pro",
      "Multi-seat team dashboard",
      "White-label booking portal",
      "API access & webhooks",
      "Custom onboarding & training",
      "SLA-backed support",
    ],
    cta: "Contact sales",
    href: "mailto:hello@lenslink.ai",
    featured: false,
  },
];

const CREATOR_TIERS = [
  {
    name: "Starter",
    price: "₹0",
    period: "forever",
    desc: "List your business and start getting discovered.",
    features: [
      "Public profile & portfolio",
      "Receive quote requests",
      "Basic analytics",
      "Up to 3 service listings",
    ],
    cta: "List for free",
    href: "/signup",
    featured: false,
  },
  {
    name: "Pro",
    price: "₹499",
    period: "/month",
    desc: "Rank higher, get verified & unlock premium leads.",
    features: [
      "Everything in Starter",
      "Verified badge",
      "Priority search ranking",
      "Unlimited service listings",
      "Lead insights & CRM",
      "Instant payout settlement",
    ],
    cta: "Go Pro",
    href: "/signup",
    featured: true,
  },
];

function PricingPage() {
  return (
    <main className="min-h-screen">
      <SiteNav />
      <section className="pt-32 pb-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-xs uppercase tracking-[0.2em] text-primary mb-3">Pricing</p>
            <h1 className="font-display text-5xl tracking-tight">Simple, transparent pricing.</h1>
            <p className="mt-4 text-muted-foreground">
              No hidden fees. Pay only when it makes sense for your workflow.
            </p>
          </div>

          <div className="mb-20">
            <h2 className="font-display text-2xl tracking-tight mb-8 flex items-center gap-2">
              For customers <Sparkles className="h-5 w-5 text-primary" />
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {CUSTOMER_TIERS.map((tier) => (
                <PricingCard key={tier.name} tier={tier} />
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-display text-2xl tracking-tight mb-8 flex items-center gap-2">
              For creators <Sparkles className="h-5 w-5 text-primary" />
            </h2>
            <div className="grid md:grid-cols-2 gap-4 max-w-3xl">
              {CREATOR_TIERS.map((tier) => (
                <PricingCard key={tier.name} tier={tier} />
              ))}
            </div>
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

function PricingCard({ tier }: { tier: (typeof CUSTOMER_TIERS)[number] | (typeof CREATOR_TIERS)[number] }) {
  return (
    <div
      className={`rounded-2xl border p-6 transition ${
        tier.featured
          ? "border-primary/40 bg-card/80 shadow-[var(--shadow-gold)]"
          : "border-border bg-card/40 hover:border-primary/20"
      }`}
    >
      {tier.featured && (
        <span className="inline-block mb-4 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs text-primary font-medium">
          Most popular
        </span>
      )}
      <div className="font-display text-xl">{tier.name}</div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="font-display text-4xl tracking-tight">{tier.price}</span>
        <span className="text-sm text-muted-foreground">{tier.period}</span>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{tier.desc}</p>
      <ul className="mt-6 space-y-2.5">
        {tier.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm">
            <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <div className="mt-8">
        {tier.href.startsWith("mailto") ? (
          <a
            href={tier.href}
            className={`inline-flex w-full items-center justify-center gap-1.5 rounded-md px-5 py-2.5 text-sm font-medium transition ${
              tier.featured
                ? "bg-[image:var(--gradient-gold)] text-primary-foreground shadow-[var(--shadow-gold)] hover:opacity-90"
                : "border border-border hover:bg-card"
            }`}
          >
            {tier.cta} <ArrowUpRight className="h-4 w-4" />
          </a>
        ) : (
          <Link
            to={tier.href}
            className={`inline-flex w-full items-center justify-center gap-1.5 rounded-md px-5 py-2.5 text-sm font-medium transition ${
              tier.featured
                ? "bg-[image:var(--gradient-gold)] text-primary-foreground shadow-[var(--shadow-gold)] hover:opacity-90"
                : "border border-border hover:bg-card"
            }`}
          >
            {tier.cta} <ArrowUpRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
