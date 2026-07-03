import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/faq")({
  component: FaqPage,
  head: () => ({
    meta: [
      { title: "FAQ — LensLink" },
      { name: "description", content: "Answers to common questions about booking creators, listing your business, verification, and how LensLink works." },
      { property: "og:title", content: "LensLink FAQ" },
      { property: "og:description", content: "Everything you need to know about LensLink." },
    ],
  }),
});

const FAQS = [
  { q: "Are the creators on LensLink real?", a: "Yes. Every listing is either self-onboarded by the business owner or sourced from public Google Business profiles and only becomes bookable after the owner claims and verifies it." },
  { q: "How much does it cost to list?", a: "Listing is completely free. LensLink only takes a small platform commission on successful bookings — there are no lead fees or subscription costs." },
  { q: "How do I claim a listing that already exists?", a: "Search the marketplace for your business, open the profile and click 'Claim this listing'. Our team reviews claims from the Admin console." },
  { q: "How does location search work?", a: "You can use GPS or type a city/ZIP. LensLink filters listings server-side within your chosen radius and remembers your preference for next time." },
  { q: "Do you support editors too?", a: "Yes — editors have a dedicated workspace to claim projects from a shared pool, upload versioned deliverables and manage revision threads." },
  { q: "How are reviews collected?", a: "Only clients with a completed booking can leave a verified review. Google reviews from claimed listings are shown separately." },
  { q: "Which cities are covered?", a: "LensLink is live across India with the strongest coverage in Mumbai, Bengaluru, Delhi, Hyderabad, Pune, Goa, Jaipur and Chennai." },
];

function FaqPage() {
  return (
    <main className="min-h-screen">
      <SiteNav />
      <section className="pt-32 pb-12">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-primary mb-3">FAQ</p>
          <h1 className="font-display text-5xl lg:text-6xl tracking-tight">Questions, <span className="text-gradient-gold">answered</span>.</h1>
        </div>
      </section>
      <section className="pb-24">
        <div className="max-w-3xl mx-auto px-6 space-y-3">
          {FAQS.map((f) => (
            <details key={f.q} className="group rounded-2xl border border-border bg-card p-5 open:border-primary/40 transition">
              <summary className="cursor-pointer list-none flex items-center justify-between gap-4 font-medium">
                {f.q}
                <span className="text-primary text-xl transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}