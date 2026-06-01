import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { MapPin, Search, Star, SlidersHorizontal, X, Loader2, ArrowUpRight, ShieldCheck } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { listListings } from "@/lib/listings.functions";
import { BUDGET_BANDS, type BudgetBandId, SORT_OPTIONS, type SortId } from "@/lib/listings";
import { formatINR } from "@/lib/format";

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  city: fallback(z.string(), "").default(""),
  category: fallback(z.enum(["all", "photographer", "videographer", "editor"]), "all").default("all"),
  budget: fallback(z.enum(["any", "u1k", "1to5", "5to10", "10to25", "25plus"]), "any").default("any"),
  minRating: fallback(z.number().min(0).max(5), 0).default(0),
  sort: fallback(z.enum(["price_asc", "rating_desc", "reviews_desc"]), "price_asc").default("price_asc"),
});

export const Route = createFileRoute("/marketplace")({
  validateSearch: zodValidator(searchSchema),
  component: Marketplace,
  head: () => ({
    meta: [
      { title: "Find real photographers, videographers & editors near you" },
      { name: "description", content: "Discover verified photographers, videographers and editors across India. Filter by location, budget and category. Real listings, transparent pricing." },
    ],
  }),
});

type Listing = Awaited<ReturnType<typeof listListings>>["listings"][number];

function Marketplace() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const fetchListings = useServerFn(listListings);
  const [results, setResults] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const update = (patch: Partial<typeof search>) =>
    navigate({ search: (p: typeof search) => ({ ...p, ...patch }), replace: true });

  const reset = () =>
    navigate({ search: { q: "", city: "", category: "all", budget: "any", minRating: 0, sort: "price_asc" } });

  useEffect(() => {
    setLoading(true);
    const band = search.budget !== "any" ? BUDGET_BANDS.find((b) => b.id === (search.budget as BudgetBandId)) : null;
    fetchListings({
      data: {
        q: search.q || undefined,
        city: search.city || undefined,
        category: search.category === "all" ? undefined : search.category,
        minRating: search.minRating || undefined,
        minPrice: band?.min,
        maxPrice: band?.max,
        sort: search.sort as SortId as "price_asc" | "rating_desc" | "reviews_desc",
        limit: 30,
      },
    })
      .then((r) => { setResults(r.listings); setTotal(r.total); })
      .finally(() => setLoading(false));
  }, [search.q, search.city, search.category, search.budget, search.minRating, search.sort, fetchListings]);

  return (
    <main className="min-h-screen">
      <SiteNav />

      <section className="pt-28 pb-10 border-b border-border/60">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-xs uppercase tracking-[0.2em] text-primary mb-3">Marketplace</p>
          <h1 className="font-display text-4xl sm:text-5xl tracking-tight max-w-3xl">Find a real creator for your next shoot.</h1>
          <p className="mt-3 text-muted-foreground max-w-xl">Verified photographers, videographers and editors across India — real businesses, transparent pricing, affordable first.</p>
        </div>
      </section>

      <section className="py-10">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-12 gap-8">
          <aside className="lg:col-span-3 lg:sticky lg:top-24 self-start">
            <div className="rounded-2xl border border-border bg-card/60 p-5">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2 text-sm font-medium"><SlidersHorizontal className="h-4 w-4 text-primary" /> Filters</div>
                <button onClick={reset} className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                  <X className="h-3 w-3" /> Reset
                </button>
              </div>

              <Group label="Search">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input value={search.q} onChange={(e) => update({ q: e.target.value })} placeholder="Business or keyword" className="w-full rounded-md bg-background border border-border pl-8 pr-3 py-2 text-sm" />
                </div>
              </Group>

              <Group label="Category">
                <Pills value={search.category} onChange={(v) => update({ category: v as typeof search.category })} options={[
                  { v: "all", l: "All" },
                  { v: "photographer", l: "Photo" },
                  { v: "videographer", l: "Video" },
                  { v: "editor", l: "Editor" },
                ]} />
              </Group>

              <Group label="Location">
                <div className="relative">
                  <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input value={search.city} onChange={(e) => update({ city: e.target.value })} placeholder="Any city in India" className="w-full rounded-md bg-background border border-border pl-8 pr-3 py-2 text-sm" />
                </div>
              </Group>

              <Group label="Budget">
                <div className="space-y-1.5">
                  {([{ v: "any", l: "Any budget" }, ...BUDGET_BANDS.map((b) => ({ v: b.id, l: b.label }))] as const).map((b) => (
                    <label key={b.v} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="radio" checked={search.budget === b.v} onChange={() => update({ budget: b.v as typeof search.budget })} className="accent-primary" />
                      <span className={search.budget === b.v ? "text-foreground" : "text-muted-foreground"}>{b.l}</span>
                    </label>
                  ))}
                </div>
              </Group>

              <Group label={`Min rating · ${search.minRating.toFixed(1)}★`}>
                <div className="flex gap-1">
                  {[0, 4, 4.5, 4.8].map((r) => (
                    <button key={r} onClick={() => update({ minRating: r })} className={`flex-1 text-xs px-2 py-2 rounded-md border transition ${search.minRating === r ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-background hover:bg-secondary/40"}`}>
                      {r === 0 ? "Any" : `${r}+`}
                    </button>
                  ))}
                </div>
              </Group>

              <Group label="Sort">
                <select value={search.sort} onChange={(e) => update({ sort: e.target.value as typeof search.sort })} className="w-full rounded-md bg-background border border-border px-3 py-2 text-sm">
                  {SORT_OPTIONS.filter((o) => ["price_asc", "rating_desc", "reviews_desc"].includes(o.id)).map((o) => (
                    <option key={o.id} value={o.id}>{o.label}</option>
                  ))}
                </select>
              </Group>
            </div>
          </aside>

          <div className="lg:col-span-9">
            <div className="flex items-center justify-between mb-6 text-sm text-muted-foreground">
              <div><span className="text-foreground font-medium">{total}</span> creators{search.city ? <> in <span className="text-foreground">{search.city}</span></> : null}</div>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>

            {!loading && results.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
                <p className="text-foreground font-medium">No creators match yet.</p>
                <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                  We only show real, verified businesses. New listings are added daily as creators sign up and admins import from public business directories.
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-2 justify-center">
                  <button onClick={reset} className="text-sm rounded-md border border-border px-4 py-2 hover:bg-secondary/40 transition">Reset filters</button>
                  <Link to="/onboarding-listing" className="text-sm rounded-md bg-[image:var(--gradient-gold)] text-primary-foreground px-4 py-2">List your business</Link>
                </div>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {results.map((p) => <Card key={p.id} l={p} />)}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function Card({ l }: { l: Listing }) {
  const unclaimed = !l.owner_user_id && l.source === "google_places";
  return (
    <article className="group rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/30 transition">
      <div className="relative aspect-[4/5] overflow-hidden bg-secondary">
        {l.cover_url ? (
          <img src={l.cover_url} alt={l.business_name} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
        ) : (
          <div className="h-full w-full grid place-items-center text-muted-foreground text-xs">No photo</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
        {l.categories[0] && <span className="absolute top-3 left-3 text-[10px] uppercase tracking-widest px-2 py-1 rounded-md bg-background/70 backdrop-blur border border-border text-muted-foreground">{l.categories[0]}</span>}
        {unclaimed && <span className="absolute top-3 right-3 text-[10px] px-2 py-1 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/30 backdrop-blur">Unclaimed</span>}
        {!unclaimed && l.verification_status !== "unverified" && (
          <span className="absolute top-3 right-3 text-[10px] px-2 py-1 rounded-md bg-primary/15 text-primary border border-primary/30 backdrop-blur inline-flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" /> Verified
          </span>
        )}
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-medium truncate">{l.business_name}</h3>
            <p className="text-xs text-muted-foreground truncate">{l.tagline ?? l.specialties.slice(0, 2).join(" · ") ?? l.categories.join(" · ")}</p>
          </div>
          {l.min_price_inr != null && (
            <div className="text-right shrink-0">
              <div className="font-display text-base leading-none">{formatINR(l.min_price_inr)}+</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">from</div>
            </div>
          )}
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <div className="inline-flex items-center gap-1 truncate"><MapPin className="h-3 w-3" /> {l.city ?? "—"}</div>
          {l.places_rating != null && (
            <div className="inline-flex items-center gap-1">
              <Star className="h-3 w-3 fill-primary text-primary" />
              <span className="text-foreground">{l.places_rating.toFixed(1)}</span>
              <span>({l.places_review_count ?? 0})</span>
            </div>
          )}
        </div>
        <Link to="/creators/$handle" params={{ handle: l.slug }} className="mt-5 inline-flex w-full items-center justify-center gap-1 rounded-md bg-[image:var(--gradient-gold)] text-primary-foreground px-3 py-2 text-sm font-medium hover:opacity-90 transition">
          View profile <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-4 border-t border-border/60 first-of-type:border-t-0 first-of-type:pt-0">
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">{label}</div>
      {children}
    </div>
  );
}

function Pills<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { v: T; l: string }[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button key={o.v} onClick={() => onChange(o.v)} className={`text-xs px-3 py-1.5 rounded-full border transition ${value === o.v ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-background hover:bg-secondary/40 text-muted-foreground"}`}>
          {o.l}
        </button>
      ))}
    </div>
  );
}