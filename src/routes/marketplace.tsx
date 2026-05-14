import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useMemo } from "react";
import { Search, MapPin, Star, SlidersHorizontal, X, ArrowUpRight } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { PROFESSIONALS, CITIES, type Category, type Availability } from "@/lib/professionals";

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  city: fallback(z.string(), "all").default("all"),
  category: fallback(z.enum(["all", "photographer", "videographer", "editor"]), "all").default("all"),
  availability: fallback(z.enum(["any", "today", "this-week", "this-month"]), "any").default("any"),
  minRating: fallback(z.number().min(0).max(5), 0).default(0),
  maxBudget: fallback(z.number().min(50).max(1000), 1000).default(1000),
});

export const Route = createFileRoute("/marketplace")({
  validateSearch: zodValidator(searchSchema),
  component: Marketplace,
  head: () => ({
    meta: [
      { title: "Marketplace — LensLink AI" },
      { name: "description", content: "Browse photographers, videographers and editors. Filter by location, budget, rating, category and availability." },
    ],
  }),
});

function Marketplace() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const update = (patch: Partial<typeof search>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true });

  const reset = () =>
    navigate({ search: { q: "", city: "all", category: "all", availability: "any", minRating: 0, maxBudget: 1000 } });

  const results = useMemo(() => {
    return PROFESSIONALS.filter((p) => {
      if (search.q && !`${p.name} ${p.specialty} ${p.handle}`.toLowerCase().includes(search.q.toLowerCase())) return false;
      if (search.city !== "all" && p.city !== search.city) return false;
      if (search.category !== "all" && p.category !== search.category) return false;
      if (search.availability !== "any" && p.availability !== search.availability) return false;
      if (p.rating < search.minRating) return false;
      if (p.hourly > search.maxBudget) return false;
      return true;
    });
  }, [search]);

  const activeFilters =
    (search.city !== "all" ? 1 : 0) +
    (search.category !== "all" ? 1 : 0) +
    (search.availability !== "any" ? 1 : 0) +
    (search.minRating > 0 ? 1 : 0) +
    (search.maxBudget < 1000 ? 1 : 0);

  return (
    <main className="min-h-screen">
      <SiteNav />
      <section className="pt-28 pb-10 border-b border-border/60">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-xs uppercase tracking-[0.2em] text-primary mb-3">Marketplace</p>
          <h1 className="font-display text-4xl sm:text-5xl tracking-tight max-w-3xl">Find the right creator for your next shoot.</h1>
          <p className="mt-3 text-muted-foreground max-w-xl">12,000+ verified photographers, videographers and editors. Filter, compare, book in minutes.</p>
          <div className="mt-8 relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search.q}
              onChange={(e) => update({ q: e.target.value })}
              placeholder="Try ‘wedding in Florence’ or ‘product editor’"
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>
      </section>

      <section className="py-10">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-12 gap-8">
          <aside className="lg:col-span-3 lg:sticky lg:top-24 self-start">
            <div className="rounded-2xl border border-border bg-card/60 p-5">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <SlidersHorizontal className="h-4 w-4 text-primary" /> Filters
                  {activeFilters > 0 && <span className="text-xs px-1.5 py-0.5 rounded bg-primary/15 text-primary border border-primary/30">{activeFilters}</span>}
                </div>
                {activeFilters > 0 && (
                  <button onClick={reset} className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                    <X className="h-3 w-3" /> Clear
                  </button>
                )}
              </div>

              <FilterGroup label="Category">
                <Pills
                  value={search.category}
                  onChange={(v) => update({ category: v as Category | "all" })}
                  options={[
                    { v: "all", l: "All" },
                    { v: "photographer", l: "Photo" },
                    { v: "videographer", l: "Video" },
                    { v: "editor", l: "Editor" },
                  ]}
                />
              </FilterGroup>

              <FilterGroup label="Location">
                <select
                  value={search.city}
                  onChange={(e) => update({ city: e.target.value })}
                  className="w-full rounded-md bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="all">All cities</option>
                  {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </FilterGroup>

              <FilterGroup label="Availability">
                <Pills
                  value={search.availability}
                  onChange={(v) => update({ availability: v as Availability | "any" })}
                  options={[
                    { v: "any", l: "Any" },
                    { v: "today", l: "Today" },
                    { v: "this-week", l: "This week" },
                    { v: "this-month", l: "This month" },
                  ]}
                />
              </FilterGroup>

              <FilterGroup label={`Max budget · $${search.maxBudget}/hr`}>
                <input
                  type="range" min={50} max={1000} step={10}
                  value={search.maxBudget}
                  onChange={(e) => update({ maxBudget: Number(e.target.value) })}
                  className="w-full accent-[oklch(0.78_0.13_82)]"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1"><span>$50</span><span>$1000+</span></div>
              </FilterGroup>

              <FilterGroup label={`Min rating · ${search.minRating.toFixed(1)}★`}>
                <div className="flex gap-1">
                  {[0, 4, 4.5, 4.8, 4.9].map((r) => (
                    <button
                      key={r}
                      onClick={() => update({ minRating: r })}
                      className={`flex-1 text-xs px-2 py-2 rounded-md border transition ${search.minRating === r ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-background hover:bg-secondary/40"}`}
                    >
                      {r === 0 ? "Any" : `${r}+`}
                    </button>
                  ))}
                </div>
              </FilterGroup>
            </div>
          </aside>

          <div className="lg:col-span-9">
            <div className="flex items-center justify-between mb-6">
              <div className="text-sm text-muted-foreground">
                <span className="text-foreground font-medium">{results.length}</span> creators
                {search.city !== "all" && <> in <span className="text-foreground">{search.city}</span></>}
              </div>
            </div>

            {results.length === 0 ? (
              <div className="rounded-2xl border border-border bg-card/60 p-12 text-center">
                <p className="text-foreground font-medium">No matches yet.</p>
                <p className="text-sm text-muted-foreground mt-1">Try widening your filters — or let our AI find the right fit.</p>
                <button onClick={reset} className="mt-5 inline-flex items-center gap-1 text-sm rounded-md border border-border px-4 py-2 hover:bg-secondary/40 transition">
                  Reset filters
                </button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {results.map((p) => (
                  <article key={p.id} className="group rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/30 transition">
                    <div className="relative aspect-[4/5] overflow-hidden">
                      <img src={p.image} alt={p.name} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
                      <span className="absolute top-3 left-3 text-[10px] uppercase tracking-widest px-2 py-1 rounded-md bg-background/70 backdrop-blur border border-border text-muted-foreground">{p.category}</span>
                      <span className="absolute top-3 right-3 text-[10px] px-2 py-1 rounded-md bg-primary/15 text-primary border border-primary/30 backdrop-blur capitalize">{p.availability.replace("-", " ")}</span>
                    </div>
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-medium">{p.name}</h3>
                          <p className="text-xs text-muted-foreground">{p.specialty}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-display text-lg leading-none">${p.hourly}</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">/ hour</div>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                        <div className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {p.city}</div>
                        <div className="inline-flex items-center gap-1">
                          <Star className="h-3 w-3 fill-primary text-primary" />
                          <span className="text-foreground">{p.rating.toFixed(1)}</span>
                          <span>({p.reviews})</span>
                        </div>
                      </div>
                      <Link
                        to="/marketplace"
                        className="mt-5 inline-flex w-full items-center justify-center gap-1 rounded-md bg-[image:var(--gradient-gold)] text-primary-foreground px-3 py-2 text-sm font-medium hover:opacity-90 transition"
                      >
                        View profile <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
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
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          className={`text-xs px-3 py-1.5 rounded-full border transition ${value === o.v ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-background hover:bg-secondary/40 text-muted-foreground"}`}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}
