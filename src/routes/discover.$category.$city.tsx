import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { MapPin, Star, ArrowUpRight, ShieldCheck } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { listListings } from "@/lib/listings.functions";
import { formatINR } from "@/lib/format";

const CATS = ["photographer", "videographer", "editor"] as const;
type Cat = (typeof CATS)[number];

function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }
function unslug(s: string) { return s.split("-").map(cap).join(" "); }

export const Route = createFileRoute("/discover/$category/$city")({
  beforeLoad: ({ params }) => {
    if (!CATS.includes(params.category as Cat)) throw notFound();
  },
  head: ({ params }) => {
    const city = unslug(params.city);
    const cat = cap(params.category);
    const title = `Best ${cat}s in ${city} — verified, real profiles`;
    const desc = `Browse trusted ${params.category}s in ${city}. Transparent pricing, real reviews, no fake listings.`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
      ],
    };
  },
  component: DiscoverPage,
});

type Listing = Awaited<ReturnType<typeof listListings>>["listings"][number];

function DiscoverPage() {
  const { category, city } = Route.useParams();
  const cityName = unslug(city);
  const fetchListings = useServerFn(listListings);
  const [rows, setRows] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchListings({ data: { category: category as Cat, city: cityName, sort: "price_asc", limit: 30 } })
      .then((r) => setRows(r.listings))
      .finally(() => setLoading(false));
  }, [category, cityName, fetchListings]);

  return (
    <main className="min-h-screen">
      <SiteNav />
      <section className="pt-28 pb-10 border-b border-border/60">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-xs uppercase tracking-[0.2em] text-primary mb-3">Discover</p>
          <h1 className="font-display text-4xl sm:text-5xl tracking-tight max-w-3xl">Best {category}s in {cityName}</h1>
          <p className="mt-3 text-muted-foreground max-w-2xl">Real verified businesses sourced from public directories and self-serve sign-ups. Transparent pricing first.</p>
        </div>
      </section>
      <section className="py-10">
        <div className="max-w-7xl mx-auto px-6">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : rows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
              <p className="font-medium">No verified {category}s in {cityName} yet.</p>
              <p className="text-sm text-muted-foreground mt-2">New listings are added daily. <Link to="/marketplace" className="text-primary">Browse all creators →</Link></p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {rows.map((l) => (
                <article key={l.id} className="group rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/30 transition">
                  <div className="relative aspect-[4/5] overflow-hidden bg-secondary">
                    {l.cover_url ? <img src={l.cover_url} alt={l.business_name} loading="lazy" className="h-full w-full object-cover" /> : <div className="h-full w-full grid place-items-center text-xs text-muted-foreground">No photo</div>}
                    {l.verification_status !== "unverified" && <span className="absolute top-3 right-3 text-[10px] px-2 py-1 rounded-md bg-primary/15 text-primary border border-primary/30 backdrop-blur inline-flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Verified</span>}
                  </div>
                  <div className="p-5">
                    <h3 className="font-medium truncate">{l.business_name}</h3>
                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {l.city}</span>
                      {l.places_rating != null && <span className="inline-flex items-center gap-1"><Star className="h-3 w-3 fill-primary text-primary" /> {l.places_rating.toFixed(1)} ({l.places_review_count ?? 0})</span>}
                    </div>
                    {l.min_price_inr != null && <div className="font-display text-lg mt-2">From {formatINR(l.min_price_inr)}</div>}
                    <Link to="/creators/$handle" params={{ handle: l.slug }} className="mt-4 inline-flex w-full items-center justify-center gap-1 rounded-md bg-[image:var(--gradient-gold)] text-primary-foreground px-3 py-2 text-sm">View profile <ArrowUpRight className="h-4 w-4" /></Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}