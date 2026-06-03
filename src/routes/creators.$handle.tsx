import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ArrowUpRight, MapPin, Star, ShieldCheck, Globe, Phone, Instagram, Loader2, AlertCircle } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { getListingBySlug } from "@/lib/listings.functions";
import { formatINR } from "@/lib/format";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/creators/$handle")({
  component: CreatorProfile,
  head: ({ params }) => ({
    meta: [
      { title: `${params.handle} — creator profile` },
      { name: "description", content: `Profile, portfolio and contact details for ${params.handle}.` },
    ],
  }),
});

type Data = Awaited<ReturnType<typeof getListingBySlug>>;

function CreatorProfile() {
  const { handle } = Route.useParams();
  const fetchListing = useServerFn(getListingBySlug);
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchListing({ data: { slug: handle } }).then((d) => setData(d)).finally(() => setLoading(false));
  }, [handle, fetchListing]);

  if (loading) {
    return (
      <main className="min-h-screen"><SiteNav />
        <div className="pt-40 grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      </main>
    );
  }

  if (!data?.listing) {
    return (
      <main className="min-h-screen"><SiteNav />
        <div className="max-w-2xl mx-auto pt-40 px-6 text-center">
          <h1 className="font-display text-3xl">Profile not found</h1>
          <p className="text-muted-foreground mt-3">This listing may have been removed.</p>
          <Link to="/marketplace" className="mt-6 inline-flex items-center gap-1 rounded-md bg-[image:var(--gradient-gold)] text-primary-foreground px-4 py-2 text-sm">Back to marketplace <ArrowUpRight className="h-4 w-4" /></Link>
        </div>
      </main>
    );
  }

  const l = data.listing;
  const unclaimed = !l.owner_user_id;

  const requestQuote = async () => {
    if (!user) { navigate({ to: "/login" }); return; }
    if (unclaimed) { toast.error("This business hasn't claimed their profile yet. Contact them directly via the details below."); return; }
    setBooking(true);
    const { error } = await supabase.from("bookings").insert({
      customer_id: user.id,
      listing_id: l.id,
      professional_name: l.business_name,
      category: l.categories[0] ?? "photographer",
      city: l.city,
    });
    setBooking(false);
    if (error) return toast.error(error.message);
    toast.success("Quote request sent");
    navigate({ to: "/app" });
  };

  return (
    <main className="min-h-screen"><SiteNav />
      <section className="pt-24">
        <div className="relative h-[38vh] min-h-[280px] overflow-hidden border-b border-border/60 bg-secondary">
          {l.cover_url && <img src={l.cover_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        </div>
        <div className="max-w-7xl mx-auto px-6 -mt-20 relative">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
            <div className="h-28 w-28 md:h-36 md:w-36 rounded-2xl overflow-hidden border-2 border-border bg-card shadow-[var(--shadow-gold)] grid place-items-center text-muted-foreground">
              {l.avatar_url ? <img src={l.avatar_url} alt={l.business_name} className="h-full w-full object-cover" /> : l.business_name.slice(0,1)}
            </div>
            <div className="flex-1">
              <p className="text-xs uppercase tracking-[0.2em] text-primary mb-2 capitalize">{l.categories.join(" · ")}</p>
              <h1 className="font-display text-3xl sm:text-4xl tracking-tight flex flex-wrap items-center gap-3">
                {l.business_name}
                {l.verification_status !== "unverified" && <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-primary/15 text-primary border border-primary/30"><ShieldCheck className="h-3 w-3" /> Verified</span>}
              </h1>
              {l.tagline && <p className="mt-2 text-muted-foreground">{l.tagline}</p>}
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                {l.city && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {[l.city, l.state, l.country].filter(Boolean).join(", ")}</span>}
                {l.places_rating != null && <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-primary text-primary" /><span className="text-foreground">{l.places_rating.toFixed(1)}</span> ({l.places_review_count ?? 0} Google reviews)</span>}
              </div>
            </div>
          </div>
        </div>
      </section>

      {unclaimed && (
        <section className="py-6">
          <div className="max-w-7xl mx-auto px-6">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200 p-4 flex flex-wrap items-start gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-medium">This is an unclaimed listing</div>
                <p className="text-sm opacity-90 mt-1">Sourced from public Google business data. Bookings through our platform are disabled until the business owner claims and verifies this profile.</p>
              </div>
              <Link to="/claim/$listingId" params={{ listingId: l.id }} className="text-sm rounded-md bg-[image:var(--gradient-gold)] text-primary-foreground px-4 py-2">Claim this profile</Link>
            </div>
          </div>
        </section>
      )}

      <section className="py-10">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-8">
            {l.bio && (
              <div className="rounded-2xl border border-border bg-card/60 p-6">
                <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">About</h2>
                <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">{l.bio}</p>
              </div>
            )}

            {data.photos.length > 0 && (
              <div>
                <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Portfolio</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {data.photos.map((p, i) => (
                    <figure key={p.id} className={`relative overflow-hidden rounded-xl border border-border ${i === 0 ? "sm:col-span-2 sm:row-span-2 aspect-square" : "aspect-[4/5]"}`}>
                      <img src={p.url} alt={`${l.business_name} portfolio`} loading="lazy" className="h-full w-full object-cover" />
                      {p.attribution_html && <figcaption className="absolute bottom-1 right-1 text-[9px] bg-black/60 text-white/80 px-1.5 py-0.5 rounded" dangerouslySetInnerHTML={{ __html: `via ${p.attribution_html}` }} />}
                    </figure>
                  ))}
                </div>
              </div>
            )}

            {data.packages.length > 0 && (
              <div>
                <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Packages</h2>
                <div className="grid md:grid-cols-3 gap-3">
                  {data.packages.map((pk) => (
                    <div key={pk.id} className="rounded-2xl border border-border bg-card p-5">
                      <div className="font-medium">{pk.title}</div>
                      <div className="font-display text-2xl mt-2">{formatINR(pk.price_inr)}</div>
                      {pk.description && <p className="text-sm text-muted-foreground mt-3">{pk.description}</p>}
                      <div className="text-xs text-muted-foreground mt-3">Delivery: {pk.delivery_days} days</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.reviews.length > 0 && (
              <div>
                <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Reviews from real bookings</h2>
                <div className="space-y-3">
                  {data.reviews.map((r) => (
                    <div key={r.id} className="rounded-xl border border-border bg-card p-5">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">Verified client</div>
                        <div className="inline-flex items-center gap-1 text-sm"><Star className="h-3.5 w-3.5 fill-primary text-primary" /> {r.rating}</div>
                      </div>
                      {r.comment && <p className="text-sm text-muted-foreground mt-2">{r.comment}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="lg:col-span-4 lg:sticky lg:top-24 self-start space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-gold)]">
              {l.min_price_inr != null ? (
                <div className="font-display text-2xl">From {formatINR(l.min_price_inr)}{l.max_price_inr ? ` – ${formatINR(l.max_price_inr)}` : ""}</div>
              ) : (
                <div className="text-sm text-muted-foreground">Contact for pricing</div>
              )}
              <button onClick={requestQuote} disabled={booking || unclaimed} className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-[image:var(--gradient-gold)] text-primary-foreground px-3 py-2.5 text-sm font-medium disabled:opacity-40">
                {booking ? "Sending…" : unclaimed ? "Booking disabled" : "Request a quote"} {!unclaimed && <ArrowUpRight className="h-4 w-4" />}
              </button>
            </div>

            <div className="rounded-2xl border border-border bg-card/60 p-5 text-sm space-y-3">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Contact</div>
              {l.phone && <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground" /><a href={`tel:${l.phone}`} className="hover:text-primary">{l.phone}</a></div>}
              {l.website && <div className="flex items-center gap-2"><Globe className="h-3.5 w-3.5 text-muted-foreground" /><a href={l.website} target="_blank" rel="noopener" className="hover:text-primary truncate">{l.website.replace(/^https?:\/\//, "")}</a></div>}
              {l.instagram && <div className="flex items-center gap-2"><Instagram className="h-3.5 w-3.5 text-muted-foreground" /><a href={`https://instagram.com/${l.instagram.replace("@","")}`} target="_blank" rel="noopener" className="hover:text-primary">@{l.instagram.replace("@","")}</a></div>}
              {l.formatted_address && <div className="flex items-start gap-2"><MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5" /><span className="text-muted-foreground">{l.formatted_address}</span></div>}
              {!l.phone && !l.website && !l.instagram && <div className="text-muted-foreground">No public contact info available.</div>}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}