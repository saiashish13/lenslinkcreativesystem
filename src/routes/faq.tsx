import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/faq")({
  component: FAQPage,
  head: () => ({
    meta: [
      { title: "FAQ — LensLink.AI" },
      { name: "description", content: "Frequently asked questions about LensLink.AI — hiring creators, listing your business, pricing and more." },
      { property: "og:title", content: "FAQ — LensLink.AI" },
      { property: "og:description", content: "Frequently asked questions about LensLink.AI — hiring creators, listing your business, pricing and more." },
    ],
  }),
});

const FAQS = [
  {
    q: "What is LensLink.AI?",
    a: "LensLink.AI is a marketplace that connects customers with real photographers, videographers and editors across India. Every profile is sourced from public business directories and verified through claim-based onboarding.",
  },
  {
    q: "Is it free to browse and contact creators?",
    a: "Yes. Browsing the marketplace, sending messages and requesting quotes is completely free. We only charge for premium features like priority matching and AI-assisted shoot briefs.",
  },
  {
    q: "How do I list my business as a creator?",
    a: "Sign up, choose 'I'm a Creator' during onboarding, and complete your profile. You can either create a new listing or claim an existing business profile if it already appears in our directory.",
  },
  {
    q: "Are the reviews and ratings real?",
    a: "Yes. Reviews and ratings are pulled directly from Google Maps with full attribution. We do not fabricate or manipulate reviews. Once you complete a booking through LensLink, the client can also leave a verified review on our platform.",
  },
  {
    q: "How does pricing work for creators?",
    a: "Listing your business is free. Creators can upgrade to Pro (₹499/month) to get a verified badge, priority search ranking, unlimited service listings, lead insights and faster payouts.",
  },
  {
    q: "Can I change my role later?",
    a: "Absolutely. You can switch between Customer, Creator and Editor roles — or enable multiple roles — from your profile settings at any time.",
  },
  {
    q: "What cities are covered?",
    a: "We currently index creators across all major Indian cities including Mumbai, Delhi, Bengaluru, Hyderabad, Pune, Chennai, Goa, Jaipur and many more. Coverage is expanding every week.",
  },
  {
    q: "How do payments work?",
    a: "Customers and creators agree on pricing directly. LensLink does not take a commission on your deal. Pro users get access to instant payout settlement and invoicing tools.",
  },
  {
    q: "Is there a mobile app?",
    a: "Not yet — the web app is fully responsive and works great on mobile. A native mobile app is on our 2026 roadmap.",
  },
  {
    q: "How do I get support?",
    a: "Free users can reach us via email at hello@lenslink.ai. Pro and Enterprise customers get priority chat support and a dedicated account manager.",
  },
];

function FAQPage() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <main className="min-h-screen">
      <SiteNav />
      <section className="pt-32 pb-20">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-[0.2em] text-primary mb-3">FAQ</p>
            <h1 className="font-display text-5xl tracking-tight">Questions? Answers.</h1>
            <p className="mt-4 text-muted-foreground">
              Everything you need to know about using LensLink.AI.
            </p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-card/40 overflow-hidden"
              >
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="font-medium text-sm">{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${
                      open === i ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {open === i && (
                  <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-14 text-center">
            <HelpCircle className="h-6 w-6 text-primary mx-auto mb-3" />
            <h3 className="font-display text-xl tracking-tight">Still have questions?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Reach out at{" "}
              <a href="mailto:hello@lenslink.ai" className="text-primary hover:underline">
                hello@lenslink.ai
              </a>{" "}
              and we'll get back within 24 hours.
            </p>
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
