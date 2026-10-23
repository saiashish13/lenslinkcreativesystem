import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, ArrowUpRight, Sparkles } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { useServerFn } from "@tanstack/react-start";
import { createCheckoutSession } from "@/lib/checkout.functions";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

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

type PricingTier = {
  name: string;
  monthlyPrice: string;
  annualPrice: string;
  annualPeriod: string;
  period: string;
  desc: string;
  features: string[];
  cta: string;
  href: string;
  featured: boolean;
  annualDiscountLabel?: string;
  planSlug?: "customer-pro" | "creator-pro";
};

const CUSTOMER_TIERS: PricingTier[] = [
  {
    name: "Free",
    monthlyPrice: "₹0",
    annualPrice: "₹0",
    annualPeriod: "forever",
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
    monthlyPrice: "₹999",
    annualPrice: "₹9,990",
    annualPeriod: "/year",
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
    annualDiscountLabel: "Save ₹1,998",
    planSlug: "customer-pro",
  },
  {
    name: "Enterprise",
    monthlyPrice: "Custom",
    annualPrice: "Custom",
    annualPeriod: "",
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

const CREATOR_TIERS: PricingTier[] = [
  {
    name: "Starter",
    monthlyPrice: "₹0",
    annualPrice: "₹0",
    annualPeriod: "forever",
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
    monthlyPrice: "₹499",
    annualPrice: "₹4,990",
    annualPeriod: "/year",
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
    annualDiscountLabel: "Save ₹998",
    planSlug: "creator-pro",
  },
];

function PricingPage() {
  const [annual, setAnnual] = useState(false);

  return (
    <main className="min-h-screen">
      <SiteNav />
      <section className="pt-32 pb-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-xs uppercase tracking-[0.2em] text-primary mb-3">Pricing</p>
            <h1 className="font-display text-5xl tracking-tight">Simple, transparent pricing.</h1>
            <p className="mt-4 text-muted-foreground">
              No hidden fees. Pay only when it makes sense for your workflow.
            </p>
          </div>

          <div className="flex justify-center mb-16">
            <div className="inline-flex items-center gap-3 rounded-full border border-border bg-card/60 px-1.5 py-1.5">
              <button
                type="button"
                onClick={() => setAnnual(false)}
                className={`rounded-full px-5 py-1.5 text-sm font-medium transition ${
                  !annual
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setAnnual(true)}
                className={`rounded-full px-5 py-1.5 text-sm font-medium transition ${
                  annual
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Annual
              </button>
            </div>
          </div>

          <div className="mb-20">
            <h2 className="font-display text-2xl tracking-tight mb-8 flex items-center gap-2">
              For customers <Sparkles className="h-5 w-5 text-primary" />
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {CUSTOMER_TIERS.map((tier) => (
                <PricingCard key={tier.name} tier={tier} annual={annual} />
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-display text-2xl tracking-tight mb-8 flex items-center gap-2">
              For creators <Sparkles className="h-5 w-5 text-primary" />
            </h2>
            <div className="grid md:grid-cols-2 gap-4 max-w-3xl">
              {CREATOR_TIERS.map((tier) => (
                <PricingCard key={tier.name} tier={tier} annual={annual} />
              ))}
            </div>
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

function PricingCard({ tier, annual }: { tier: PricingTier; annual: boolean }) {
  const price = annual ? tier.annualPrice : tier.monthlyPrice;
  const period = annual ? tier.annualPeriod : tier.period;
  const showDiscount = annual && tier.annualDiscountLabel;
  const checkout = useServerFn(createCheckoutSession);
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (!tier.planSlug) return;
    setLoading(true);
    try {
      const { url } = await checkout({
        data: { plan: tier.planSlug, billingPeriod: annual ? "annual" : "monthly" },
      });
      if (url) window.location.href = url;
      else throw new Error("No checkout URL returned");
    } catch (err) {
      console.error(err);
      toast.error("Could not start checkout. Please try again.");
      setLoading(false);
    }
  };

  const btnClass = `inline-flex w-full items-center justify-center gap-1.5 rounded-md px-5 py-2.5 text-sm font-medium transition ${
    tier.featured
      ? "bg-[image:var(--gradient-gold)] text-primary-foreground shadow-[var(--shadow-gold)] hover:opacity-90"
      : "border border-border hover:bg-card"
  }`;

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
        <span className="font-display text-4xl tracking-tight">{price}</span>
        <span className="text-sm text-muted-foreground">{period}</span>
      </div>
      {showDiscount && (
        <span className="mt-1 inline-block rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400 font-medium">
          {tier.annualDiscountLabel}
        </span>
      )}
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
        {tier.planSlug ? (
          <button
            type="button"
            onClick={handleCheckout}
            disabled={loading}
            className={`${btnClass} disabled:opacity-60`}
          >
            {loading ? "Redirecting…" : tier.cta} <ArrowUpRight className="h-4 w-4" />
          </button>
        ) : tier.href.startsWith("mailto") ? (
          <a
            href={tier.href}
            className={btnClass}
          >
            {tier.cta} <ArrowUpRight className="h-4 w-4" />
          </a>
        ) : (
          <Link
            to={tier.href}
            className={btnClass}
          >
            {tier.cta} <ArrowUpRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
