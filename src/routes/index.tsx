import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Camera, Sparkles, CalendarCheck, MessagesSquare, ShieldCheck, Wand2, Star, Check, Plus } from "lucide-react";
import { useState } from "react";
import { SiteNav } from "@/components/site-nav";
import hero from "@/assets/hero-photographer.jpg";
import w1 from "@/assets/work-1.jpg";
import w2 from "@/assets/work-2.jpg";
import w3 from "@/assets/work-3.jpg";
import w4 from "@/assets/work-4.jpg";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "LensLink AI — Hire photographers, videographers & editors" },
      { name: "description", content: "AI-powered marketplace to discover, book, pay and deliver creative work with photographers, videographers and editors." },
    ],
  }),
});

function Hero() {
  return (
    <section className="relative pt-32 pb-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground mb-6">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Now with autonomous booking & delivery agents
          </div>
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[0.95] tracking-tight">
            The creative marketplace, <span className="text-gradient-gold">automated</span> end to end.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-xl">
            Discover photographers, videographers and editors. Book sessions, chat in real time, pay securely and receive final deliverables — orchestrated by AI agents working quietly in the background.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/marketplace" className="inline-flex items-center gap-2 rounded-md bg-[image:var(--gradient-gold)] text-primary-foreground px-5 py-3 text-sm font-medium shadow-[var(--shadow-gold)] hover:opacity-90 transition">
              Hire a creator <ArrowUpRight className="h-4 w-4" />
            </Link>
            <a href="#features" className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-3 text-sm hover:bg-card transition">
              I'm a creator
            </a>
          </div>
          <div className="mt-10 flex items-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-1"><Star className="h-4 w-4 fill-primary text-primary" /> 4.9 avg rating</div>
            <div>12k+ verified creators</div>
            <div className="hidden sm:block">98% on-time delivery</div>
          </div>
        </div>
        <div className="lg:col-span-5 relative">
          <div className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-border shadow-[var(--shadow-elegant)]">
            <img src={hero} alt="Photographer behind a camera in dramatic golden light" width={1536} height={1536} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 rounded-xl bg-card/80 backdrop-blur-md border border-border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">Booked in 12s</div>
                  <div className="text-sm font-medium">Editorial shoot · Brooklyn · Sat 4pm</div>
                </div>
                <span className="text-xs px-2 py-1 rounded-md bg-primary/15 text-primary border border-primary/30">AI agent</span>
              </div>
            </div>
          </div>
          <div className="absolute -top-6 -left-6 hidden md:block rounded-xl border border-border bg-card/80 backdrop-blur-md p-3 text-xs shadow-[var(--shadow-elegant)]">
            <div className="flex items-center gap-2"><Wand2 className="h-3.5 w-3.5 text-primary" /> Auto-tagged 248 photos</div>
          </div>
        </div>
      </div>
    </section>
  );
}

const logos = ["VOGUE", "MAGNUM", "NETFLIX", "AIRBNB", "STRIPE", "PATAGONIA"];
function Logos() {
  return (
    <section className="border-y border-border/60 py-10">
      <div className="max-w-7xl mx-auto px-6">
        <p className="text-center text-xs uppercase tracking-[0.2em] text-muted-foreground mb-6">Trusted by studios and brands worldwide</p>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-6 items-center">
          {logos.map(l => (
            <div key={l} className="text-center font-display text-lg text-muted-foreground/70 tracking-widest">{l}</div>
          ))}
        </div>
      </div>
    </section>
  );
}

const features = [
  { icon: Sparkles, title: "AI matchmaking", body: "Describe your vision in plain language — our agent surfaces the perfect creator from 12k+ verified pros." },
  { icon: CalendarCheck, title: "Autonomous booking", body: "Smart scheduling resolves conflicts, syncs calendars and confirms sessions without back-and-forth." },
  { icon: MessagesSquare, title: "Chat, calls & files", body: "Real-time messaging, video consults and chunked uploads for RAW files — all in one room." },
  { icon: Wand2, title: "Editing copilot", body: "Auto-cull, tag, enhance and version. Editors ship 3× faster with the LensLink AI assistant." },
  { icon: ShieldCheck, title: "Escrow payments", body: "Funds held safely until delivery. Multi-currency, partial payments, instant payouts." },
  { icon: Camera, title: "Portfolio that sells", body: "AI-written descriptions, auto SEO and Instagram-grade galleries that convert browsers into clients." },
];
function Features() {
  return (
    <section id="features" className="py-28">
      <div className="max-w-7xl mx-auto px-6">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.2em] text-primary mb-4">The platform</p>
          <h2 className="font-display text-4xl sm:text-5xl tracking-tight">One workspace for the whole creative pipeline.</h2>
          <p className="mt-4 text-muted-foreground">From first inquiry to final delivery, LensLink AI replaces a dozen tools and a dozen emails.</p>
        </div>
        <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-border/60 rounded-2xl overflow-hidden border border-border">
          {features.map(({ icon: Icon, title, body }) => (
            <div key={title} className="bg-card p-8 group hover:bg-secondary/40 transition">
              <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-5">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-medium">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const works = [
  { src: w1, tag: "Editorial · Portrait", name: "Lior Avraham" },
  { src: w2, tag: "Wedding · Cinematic", name: "Marta Esposito" },
  { src: w3, tag: "Product · Commercial", name: "Studio Kuro" },
  { src: w4, tag: "Film · Behind the lens", name: "Reel Collective" },
];
function Discover() {
  return (
    <section id="discover" className="py-28 border-t border-border/60">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-end justify-between gap-6 mb-10">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-primary mb-4">Discover talent</p>
            <h2 className="font-display text-4xl sm:text-5xl tracking-tight max-w-xl">Hand-picked work from creators on LensLink.</h2>
          </div>
          <a href="#" className="hidden sm:inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">Browse all <ArrowUpRight className="h-4 w-4" /></a>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {works.map((w, i) => (
            <a key={i} href="#" className="group relative aspect-[4/5] rounded-xl overflow-hidden border border-border block">
              <img src={w.src} alt={w.tag} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <div className="text-xs text-primary mb-1">{w.tag}</div>
                <div className="text-sm font-medium">{w.name}</div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function Workflow() {
  const steps = [
    { k: "01", t: "Describe your shoot", b: "A wedding, a product launch, an editorial. Tell our agent what you need." },
    { k: "02", t: "Get matched in seconds", b: "AI ranks creators by style, budget, availability and reviews." },
    { k: "03", t: "Book, chat & pay", b: "Confirm the slot, share references, fund escrow — all in one flow." },
    { k: "04", t: "Receive final files", b: "Watermarked previews, secure delivery, one-tap revisions and 5-star reviews." },
  ];
  return (
    <section className="py-28 border-t border-border/60">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-4">
          <p className="text-xs uppercase tracking-[0.2em] text-primary mb-4">How it works</p>
          <h2 className="font-display text-4xl sm:text-5xl tracking-tight">From idea to deliverable in four moves.</h2>
          <p className="mt-4 text-muted-foreground">Designed for clients who want it done — and creators who want to create.</p>
        </div>
        <ol className="lg:col-span-8 grid sm:grid-cols-2 gap-px bg-border/60 rounded-2xl overflow-hidden border border-border">
          {steps.map(s => (
            <li key={s.k} className="bg-card p-8">
              <div className="text-primary font-display text-2xl">{s.k}</div>
              <div className="mt-4 text-lg font-medium">{s.t}</div>
              <p className="mt-2 text-sm text-muted-foreground">{s.b}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const plans = [
  { name: "Starter", price: "Free", desc: "For clients booking their first shoot.", features: ["AI matchmaking", "Secure escrow", "Up to 3 active bookings"], cta: "Start free" },
  { name: "Pro", price: "$29", suffix: "/mo", desc: "For working creators.", features: ["Featured portfolio", "AI editing copilot", "Auto invoices & calendar sync", "Priority leads"], cta: "Go Pro", featured: true },
  { name: "Agency", price: "$99", suffix: "/mo", desc: "For studios and teams.", features: ["Team workspaces", "White-label delivery", "Approval workflows", "API & webhooks"], cta: "Talk to sales" },
];
function Pricing() {
  return (
    <section id="pricing" className="py-28 border-t border-border/60">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-xs uppercase tracking-[0.2em] text-primary mb-4">Pricing</p>
          <h2 className="font-display text-4xl sm:text-5xl tracking-tight">Simple plans. Built to scale with you.</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {plans.map(p => (
            <div key={p.name} className={`relative rounded-2xl border p-8 ${p.featured ? "border-primary/40 bg-card shadow-[var(--shadow-gold)]" : "border-border bg-card/60"}`}>
              {p.featured && <div className="absolute -top-3 left-8 text-[10px] uppercase tracking-widest bg-[image:var(--gradient-gold)] text-primary-foreground px-2 py-1 rounded-md">Most loved</div>}
              <div className="text-sm text-muted-foreground">{p.name}</div>
              <div className="mt-3 flex items-baseline gap-1">
                <div className="font-display text-5xl">{p.price}</div>
                {p.suffix && <div className="text-muted-foreground text-sm">{p.suffix}</div>}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>
              <ul className="mt-6 space-y-3 text-sm">
                {p.features.map(f => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <a href="#cta" className={`mt-8 inline-flex w-full items-center justify-center gap-1 rounded-md px-4 py-2.5 text-sm font-medium transition ${p.featured ? "bg-[image:var(--gradient-gold)] text-primary-foreground hover:opacity-90" : "border border-border hover:bg-secondary"}`}>
                {p.cta} <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section id="cta" className="py-28 border-t border-border/60">
      <div className="max-w-5xl mx-auto px-6 text-center">
        <h2 className="font-display text-5xl sm:text-6xl tracking-tight">Your next shoot, <span className="text-gradient-gold">already booked</span>.</h2>
        <p className="mt-5 text-muted-foreground max-w-xl mx-auto">Join 40,000+ clients and creators using LensLink AI to ship beautiful work without the busywork.</p>
        <form className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
          <input type="email" required placeholder="you@studio.com" className="flex-1 rounded-md bg-card border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
          <button className="inline-flex items-center justify-center gap-1 rounded-md bg-[image:var(--gradient-gold)] text-primary-foreground px-5 py-3 text-sm font-medium shadow-[var(--shadow-gold)] hover:opacity-90 transition">
            Get early access <ArrowUpRight className="h-4 w-4" />
          </button>
        </form>
      </div>
    </section>
  );
}

const testimonials = [
  { quote: "We replaced four tools with LensLink. Our booking-to-delivery time dropped from 11 days to 3.", name: "Amelia Chen", role: "Founder, Studio Kuro" },
  { quote: "The AI matchmaking found me a wedding photographer in Tuscany at 1am. Booked, paid, done.", name: "Jonas Weber", role: "Client · Berlin" },
  { quote: "Auto-cull and tagging alone save me 6 hours per shoot. It feels illegal.", name: "Priya Raman", role: "Editor · Mumbai" },
];
function Testimonials() {
  return (
    <section className="py-28 border-t border-border/60">
      <div className="max-w-7xl mx-auto px-6">
        <div className="max-w-2xl mb-14">
          <p className="text-xs uppercase tracking-[0.2em] text-primary mb-4">Loved by creators</p>
          <h2 className="font-display text-4xl sm:text-5xl tracking-tight">A quiet revolution in the studio.</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {testimonials.map((t) => (
            <figure key={t.name} className="rounded-2xl border border-border bg-card p-8 flex flex-col">
              <div className="flex gap-0.5 mb-5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div>
              <blockquote className="text-base leading-relaxed flex-1">"{t.quote}"</blockquote>
              <figcaption className="mt-6 pt-5 border-t border-border/60">
                <div className="text-sm font-medium">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.role}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

const faqs = [
  { q: "How does the AI matchmaking work?", a: "Describe your shoot in plain language — event, style, budget, location, dates. Our agent ranks creators using portfolio embeddings, availability, reviews and price-to-fit, then surfaces the top three with reasoning." },
  { q: "When do creators get paid?", a: "Funds are held in escrow when the client books. They release automatically on delivery acceptance, or after a 72-hour review window. Payouts hit your account within 1 business day in 38 currencies." },
  { q: "Can I bring my own clients?", a: "Yes. Pro and Agency plans include a private booking link with your branding — clients book, pay and chat through LensLink without ever seeing the marketplace." },
  { q: "What about RAW files and large deliveries?", a: "Chunked uploads handle files up to 50GB per delivery. Watermarked previews are generated automatically; final files are unlocked on payment with expiring secure links." },
  { q: "Do you take a commission?", a: "On the Free plan, 10% on completed bookings. Pro reduces it to 5%. Agency is 0% commission with a flat monthly seat fee — best for established studios." },
  { q: "Is there a mobile app?", a: "The web app is a fully installable PWA with offline mode and push notifications. Native iOS and Android apps are on the roadmap for Q3." },
];
function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="py-28 border-t border-border/60">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-14">
          <p className="text-xs uppercase tracking-[0.2em] text-primary mb-4">FAQ</p>
          <h2 className="font-display text-4xl sm:text-5xl tracking-tight">Questions, answered.</h2>
        </div>
        <div className="rounded-2xl border border-border bg-card/60 divide-y divide-border">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q}>
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-6 text-left px-6 py-5 hover:bg-secondary/30 transition"
                  aria-expanded={isOpen}
                >
                  <span className="text-base font-medium">{f.q}</span>
                  <Plus className={`h-4 w-4 text-primary shrink-0 transition-transform duration-300 ${isOpen ? "rotate-45" : ""}`} />
                </button>
                <div className={`grid transition-all duration-300 ease-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                  <div className="overflow-hidden">
                    <p className="px-6 pb-6 text-sm text-muted-foreground leading-relaxed max-w-3xl">{f.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/60 py-12">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-[image:var(--gradient-gold)] text-primary-foreground"><Camera className="h-3 w-3" /></span>
          © {new Date().getFullYear()} LensLink AI — Crafted for creators.
        </div>
        <div className="flex items-center gap-6">
          <a href="#" className="hover:text-foreground">Privacy</a>
          <a href="#" className="hover:text-foreground">Terms</a>
          <a href="#" className="hover:text-foreground">Contact</a>
        </div>
      </div>
    </footer>
  );
}

function Landing() {
  return (
    <main className="min-h-screen">
      <SiteNav />
      <Hero />
      <Logos />
      <Features />
      <Discover />
      <Workflow />
      <Testimonials />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </main>
  );
}
