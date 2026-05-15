import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowUpRight, Calendar, Camera, Check, Clock, MapPin, MessageSquare, Share2, Star, Verified } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { getProfessional, PROFESSIONALS } from "@/lib/professionals";
import { formatINR } from "@/lib/format";
import work1 from "@/assets/work-1.jpg";
import work2 from "@/assets/work-2.jpg";
import work3 from "@/assets/work-3.jpg";
import work4 from "@/assets/work-4.jpg";

const PORTFOLIO = [work1, work2, work3, work4, work2, work3];

export const Route = createFileRoute("/creators/$handle")({
  loader: ({ params }) => {
    const pro = getProfessional(params.handle);
    if (!pro) throw notFound();
    return { pro };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.pro.name} — ${loaderData.pro.specialty} · LensLink AI` },
          { name: "description", content: `Book ${loaderData.pro.name}, ${loaderData.pro.specialty} based in ${loaderData.pro.city}. ${loaderData.pro.rating}★ from ${loaderData.pro.reviews} clients.` },
          { property: "og:title", content: `${loaderData.pro.name} on LensLink AI` },
          { property: "og:image", content: loaderData.pro.image },
        ]
      : [],
  }),
  notFoundComponent: () => (
    <main className="min-h-screen">
      <SiteNav />
      <div className="max-w-3xl mx-auto pt-40 px-6 text-center">
        <h1 className="font-display text-4xl">Creator not found</h1>
        <p className="text-muted-foreground mt-3">This profile may have moved or been removed.</p>
        <Link to="/marketplace" className="mt-6 inline-flex items-center gap-1 rounded-md bg-[image:var(--gradient-gold)] text-primary-foreground px-4 py-2 text-sm font-medium">
          Back to marketplace <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </main>
  ),
  errorComponent: ({ error }) => (
    <main className="min-h-screen pt-40 px-6 text-center">
      <p className="text-destructive">{error.message}</p>
    </main>
  ),
  component: CreatorProfile,
});

const SERVICES = [
  { name: "Half-day shoot", duration: "4 hours", priceMult: 4, includes: ["On-location shoot", "Edited gallery (40+ images)", "Commercial license"] },
  { name: "Full-day shoot", duration: "8 hours", priceMult: 7.5, includes: ["Full coverage", "Edited gallery (100+ images)", "Same-week delivery", "Commercial license"] },
  { name: "Editorial campaign", duration: "2 days", priceMult: 14, includes: ["Pre-production", "Studio + on-location", "Final retouching", "Extended license"] },
];

function CreatorProfile() {
  const { pro } = Route.useLoaderData();
  const [tab, setTab] = useState<"portfolio" | "services" | "reviews">("portfolio");
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return { i, label: d.toLocaleDateString("en-US", { weekday: "short" }), date: d.getDate(), full: d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }) };
  });
  const slots = ["09:00", "11:00", "13:30", "15:00", "17:30"];

  const related = PROFESSIONALS.filter((p) => p.id !== pro.id && p.category === pro.category).slice(0, 3);

  return (
    <main className="min-h-screen">
      <SiteNav />

      {/* Hero */}
      <section className="pt-24">
        <div className="relative h-[42vh] min-h-[320px] overflow-hidden border-b border-border/60">
          <img src={pro.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        </div>
        <div className="max-w-7xl mx-auto px-6 -mt-24 relative">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
            <div className="h-32 w-32 md:h-40 md:w-40 rounded-2xl overflow-hidden border-2 border-border bg-card shadow-[var(--shadow-gold)]">
              <img src={pro.image} alt={pro.name} className="h-full w-full object-cover" />
            </div>
            <div className="flex-1">
              <p className="text-xs uppercase tracking-[0.2em] text-primary mb-2 capitalize">{pro.category}</p>
              <h1 className="font-display text-3xl sm:text-5xl tracking-tight flex items-center gap-3">
                {pro.name}
                <Verified className="h-6 w-6 text-primary" />
              </h1>
              <p className="mt-2 text-muted-foreground">@{pro.handle} · {pro.specialty}</p>
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {pro.city}, {pro.country}</span>
                <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-primary text-primary" /> <span className="text-foreground">{pro.rating.toFixed(1)}</span> ({pro.reviews} reviews)</span>
                <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {pro.experience} yrs experience</span>
                <span className="inline-flex items-center gap-1"><Camera className="h-3.5 w-3.5" /> {pro.languages.join(" · ")}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="inline-flex items-center gap-1.5 rounded-md border border-border px-4 py-2 text-sm hover:bg-secondary/40 transition">
                <Share2 className="h-4 w-4" /> Share
              </button>
              <button className="inline-flex items-center gap-1.5 rounded-md border border-border px-4 py-2 text-sm hover:bg-secondary/40 transition">
                <MessageSquare className="h-4 w-4" /> Message
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8">
            {/* Bio */}
            <div className="rounded-2xl border border-border bg-card/60 p-6">
              <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">About</h2>
              <p className="text-foreground/90 leading-relaxed">
                {pro.name} is a {pro.specialty.toLowerCase()} creator based in {pro.city}, working with brands and clients worldwide for over {pro.experience} years.
                Known for a refined, cinematic style and an effortless on-set energy — every project is approached with intention, craft and a story-first mindset.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {["Brand", "Editorial", "Studio", "On-location", "Commercial license"].map((t) => (
                  <span key={t} className="text-xs px-2.5 py-1 rounded-full border border-border bg-background text-muted-foreground">{t}</span>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-8 border-b border-border/60 flex gap-6 text-sm">
              {(["portfolio", "services", "reviews"] as const).map((t) => (
                <button key={t} onClick={() => setTab(t)} className={`pb-3 -mb-px capitalize transition border-b-2 ${tab === t ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                  {t}
                </button>
              ))}
            </div>

            <div className="mt-8">
              {tab === "portfolio" && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {PORTFOLIO.map((src, i) => (
                    <div key={i} className={`relative overflow-hidden rounded-xl border border-border ${i === 0 ? "sm:col-span-2 sm:row-span-2 aspect-square" : "aspect-[4/5]"}`}>
                      <img src={src} alt={`${pro.name} portfolio ${i + 1}`} loading="lazy" className="h-full w-full object-cover hover:scale-105 transition duration-700" />
                    </div>
                  ))}
                </div>
              )}

              {tab === "services" && (
                <div className="grid md:grid-cols-3 gap-4">
                  {SERVICES.map((s) => (
                    <div key={s.name} className="rounded-2xl border border-border bg-card p-5 flex flex-col">
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.duration}</div>
                      <h3 className="font-display text-xl mt-1">{s.name}</h3>
                    <div className="mt-4 font-display text-3xl">{formatINR(pro.hourly * s.priceMult)}<span className="text-sm text-muted-foreground font-sans"> total</span></div>
                      <ul className="mt-4 space-y-2 text-sm text-muted-foreground flex-1">
                        {s.includes.map((it) => (
                          <li key={it} className="flex items-start gap-2"><Check className="h-4 w-4 text-primary mt-0.5 shrink-0" /> {it}</li>
                        ))}
                      </ul>
                      <button className="mt-5 inline-flex items-center justify-center gap-1 rounded-md border border-border px-3 py-2 text-sm hover:bg-secondary/40 transition">
                        Request <ArrowUpRight className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {tab === "reviews" && (
                <div className="space-y-4">
                  {[
                    { n: "Hannah W.", r: 5, t: "An absolute professional. Delivered ahead of schedule with stunning results — already booked the next campaign." },
                    { n: "Marcus T.", r: 5, t: "Effortless to work with on set, and the final edit went beyond what we briefed. Worth every dollar." },
                    { n: "Studio Onyx", r: 4.8, t: "Strong creative direction. Communication was excellent throughout pre-pro and delivery." },
                  ].map((r) => (
                    <div key={r.n} className="rounded-xl border border-border bg-card p-5">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{r.n}</div>
                        <div className="inline-flex items-center gap-1 text-sm"><Star className="h-3.5 w-3.5 fill-primary text-primary" /> {r.r}</div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">{r.t}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Booking sidebar */}
          <aside className="lg:col-span-4 lg:sticky lg:top-24 self-start">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-gold)]">
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="font-display text-3xl">{formatINR(pro.hourly)}<span className="text-sm text-muted-foreground font-sans"> /hr</span></div>
                  <div className="text-xs text-muted-foreground mt-1 capitalize">Available {pro.availability.replace("-", " ")}</div>
                </div>
                <span className="text-[10px] px-2 py-1 rounded-md bg-primary/15 text-primary border border-primary/30 inline-flex items-center gap-1">
                  <Verified className="h-3 w-3" /> ID verified
                </span>
              </div>

              <div className="mt-5">
                <div className="flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground mb-2">
                  <span>Available times</span>
                  <Calendar className="h-3.5 w-3.5" />
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                  {days.map((d) => (
                    <button
                      key={d.i}
                      onClick={() => { setSelectedDay(d.i); setSelectedSlot(null); }}
                      className={`flex flex-col items-center py-2 rounded-md border text-xs transition ${selectedDay === d.i ? "border-primary/50 bg-primary/10 text-primary" : "border-border bg-background hover:bg-secondary/40 text-muted-foreground"}`}
                    >
                      <span>{d.label}</span>
                      <span className="font-display text-base text-foreground">{d.date}</span>
                    </button>
                  ))}
                </div>

                <div className="mt-4 grid grid-cols-3 gap-1.5">
                  {slots.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSlot(s)}
                      className={`text-xs px-2 py-2 rounded-md border transition ${selectedSlot === s ? "border-primary/50 bg-primary/10 text-primary" : "border-border bg-background hover:bg-secondary/40"}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                <button
                  disabled={!selectedSlot}
                  className="mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-[image:var(--gradient-gold)] text-primary-foreground px-3 py-2.5 text-sm font-medium hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {selectedSlot ? `Book ${days[selectedDay].full} · ${selectedSlot}` : "Select a time"}
                  <ArrowUpRight className="h-4 w-4" />
                </button>

                <p className="mt-3 text-[11px] text-muted-foreground text-center">You won't be charged yet · Free cancellation up to 48h before</p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-border bg-card/60 p-5 text-sm">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Trust & safety</div>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2"><Check className="h-4 w-4 text-primary mt-0.5" /> Escrow-protected payments</li>
                <li className="flex items-start gap-2"><Check className="h-4 w-4 text-primary mt-0.5" /> AI-vetted portfolio & ID</li>
                <li className="flex items-start gap-2"><Check className="h-4 w-4 text-primary mt-0.5" /> Money-back guarantee</li>
              </ul>
            </div>
          </aside>
        </div>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="pb-20">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="font-display text-2xl mb-6">More like {pro.name.split(" ")[0]}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {related.map((r) => (
                <Link key={r.id} to="/creators/$handle" params={{ handle: r.handle }} className="group rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/30 transition">
                  <div className="relative aspect-[4/5]">
                    <img src={r.image} alt={r.name} loading="lazy" className="h-full w-full object-cover group-hover:scale-105 transition duration-700" />
                  </div>
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{r.name}</div>
                      <div className="text-xs text-muted-foreground">{r.specialty}</div>
                    </div>
                    <div className="text-sm font-display">{formatINR(r.hourly)}<span className="text-xs text-muted-foreground font-sans">/hr</span></div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}