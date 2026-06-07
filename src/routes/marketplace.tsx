import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { MapPin, Search, Star, SlidersHorizontal, X, Loader2, ArrowUpRight, ShieldCheck, Locate, Globe, Map as MapIcon, LayoutGrid, AlertCircle, Trash2 } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { MarketplaceMap } from "@/components/marketplace-map";
import { listListings } from "@/lib/listings.functions";
import { searchPlacesPublic } from "@/lib/places.functions";
import { geocodeLocation } from "@/lib/geo.functions";
import { BUDGET_BANDS, type BudgetBandId, SORT_OPTIONS, type SortId } from "@/lib/listings";
import { formatINR } from "@/lib/format";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  city: fallback(z.string(), "").default(""),
  category: fallback(z.enum(["all", "photographer", "videographer", "editor"]), "all").default("all"),
  budget: fallback(z.enum(["any", "u1k", "1to5", "5to10", "10to25", "25plus"]), "any").default("any"),
  minRating: fallback(z.number().min(0).max(5), 0).default(0),
  sort: fallback(z.enum(["price_asc", "rating_desc", "reviews_desc"]), "price_asc").default("price_asc"),
  view: fallback(z.enum(["grid", "map"]), "grid").default("grid"),
  radius: fallback(z.number().min(1).max(200), 25).default(25),
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
  const livePlaces = useServerFn(searchPlacesPublic);
  const geocode = useServerFn(geocodeLocation);
  const [results, setResults] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [coordsLabel, setCoordsLabel] = useState<string | null>(null);
  const [coordsSource, setCoordsSource] = useState<"gps" | "manual" | null>(null);
  const [geoStatus, setGeoStatus] = useState<"idle" | "prompting" | "granted" | "denied" | "unsupported" | "error">("idle");
  const [manualQuery, setManualQuery] = useState("");
  const [manualBusy, setManualBusy] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [prefsReady, setPrefsReady] = useState(false);
  const { user } = useAuth();
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load saved location preference from profile (logged-in) or localStorage (guest).
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("pref_lat,pref_lng,pref_location_label,pref_location_source,pref_radius_km")
          .eq("id", user.id)
          .maybeSingle();
        if (cancelled) return;
        if (data?.pref_lat != null && data?.pref_lng != null) {
          setCoords({ lat: data.pref_lat, lng: data.pref_lng });
          setCoordsLabel(data.pref_location_label ?? "Saved location");
          setCoordsSource((data.pref_location_source as "gps" | "manual") ?? "manual");
          if (data.pref_radius_km && data.pref_radius_km !== search.radius) {
            navigate({ search: (p: typeof search) => ({ ...p, radius: data.pref_radius_km }), replace: true });
          }
        }
      } else {
        const raw = localStorage.getItem("marketplace_location_prefs");
        if (raw) {
          try {
            const p = JSON.parse(raw);
            if (p.lat != null && p.lng != null) {
              setCoords({ lat: p.lat, lng: p.lng });
              setCoordsLabel(p.label ?? "Saved location");
              setCoordsSource(p.source ?? "manual");
              if (p.radius && p.radius !== search.radius) {
                navigate({ search: (prev: typeof search) => ({ ...prev, radius: p.radius }), replace: true });
              }
            }
          } catch {}
        }
      }
      if (!cancelled) setPrefsReady(true);
    };
    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Persist location preference (debounced). Saves to profile when logged-in and to localStorage for guests / backup.
  useEffect(() => {
    if (!prefsReady) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const payload = {
        pref_lat: coords?.lat ?? null,
        pref_lng: coords?.lng ?? null,
        pref_location_label: coords ? coordsLabel : null,
        pref_location_source: coords ? coordsSource : null,
        pref_radius_km: coords ? search.radius : null,
      };
      if (user) {
        supabase.from("profiles").update(payload).eq("id", user.id).then(() => {});
      }
      if (coords) {
        localStorage.setItem("marketplace_location_prefs", JSON.stringify({
          lat: coords.lat,
          lng: coords.lng,
          label: coordsLabel,
          source: coordsSource,
          radius: search.radius,
        }));
      } else {
        localStorage.removeItem("marketplace_location_prefs");
      }
    }, 500);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, coords?.lat, coords?.lng, coordsLabel, coordsSource, search.radius, prefsReady]);

  const update = (patch: Partial<typeof search>) =>
    navigate({ search: (p: typeof search) => ({ ...p, ...patch }), replace: true });

  const reset = () =>
    navigate({ search: { q: "", city: "", category: "all", budget: "any", minRating: 0, sort: "price_asc", view: search.view, radius: search.radius } });

  useEffect(() => {
    if (!prefsReady) return;
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
        limit: search.view === "map" ? 60 : 30,
        lat: coords?.lat,
        lng: coords?.lng,
        radiusKm: coords ? search.radius : undefined,
      },
    })
      .then((r) => { setResults(r.listings); setTotal(r.total); })
      .finally(() => setLoading(false));
  }, [search.q, search.city, search.category, search.budget, search.minRating, search.sort, search.view, search.radius, coords, fetchListings, prefsReady]);

  // On mount, check the Permissions API so we can present an accurate
  // initial state without prompting the user.
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoStatus("unsupported");
      return;
    }
    const perms = (navigator as Navigator & { permissions?: { query: (d: { name: PermissionName }) => Promise<PermissionStatus> } }).permissions;
    if (!perms?.query) return;
    perms.query({ name: "geolocation" as PermissionName })
      .then((status) => {
        if (status.state === "denied") setGeoStatus("denied");
        else if (status.state === "granted") setGeoStatus("granted");
        status.onchange = () => {
          if (status.state === "denied") setGeoStatus("denied");
          else if (status.state === "granted") setGeoStatus("granted");
        };
      })
      .catch(() => {});
  }, []);

  const useMyLocation = () => {
    if (!navigator.geolocation) { setGeoStatus("unsupported"); return; }
    setGeoStatus("prompting");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setCoordsLabel("Your current location");
        setCoordsSource("gps");
        setGeoStatus("granted");
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) setGeoStatus("denied");
        else setGeoStatus("error");
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 },
    );
  };

  const applyManualLocation = async (raw?: string) => {
    const query = (raw ?? manualQuery).trim();
    if (!query) { setManualError("Enter a city or ZIP code."); return; }
    setManualBusy(true); setManualError(null);
    try {
      const r = await geocode({ data: { query } });
      setCoords({ lat: r.lat, lng: r.lng });
      setCoordsLabel(r.formatted);
      setCoordsSource("manual");
      if (r.city) update({ city: r.city });
    } catch (e) {
      setManualError(e instanceof Error ? e.message : "Couldn't locate that place.");
    } finally {
      setManualBusy(false);
    }
  };

  const clearLocation = async () => {
    setCoords(null);
    setCoordsLabel(null);
    setCoordsSource(null);
    setGeoStatus("idle");
    localStorage.removeItem("marketplace_location_prefs");
    if (user) {
      await supabase.from("profiles").update({
        pref_lat: null,
        pref_lng: null,
        pref_location_label: null,
        pref_location_source: null,
        pref_radius_km: null,
      }).eq("id", user.id);
    }
    if (search.radius !== 25) {
      navigate({ search: (p: typeof search) => ({ ...p, radius: 25 }), replace: true });
    }
  };

  const runLiveSearch = async () => {
    const cat = search.category === "all" ? undefined : search.category;
    const baseQuery = search.q?.trim() || (cat ?? "photographer");
    if (!search.city && !coords) {
      setImportMsg("Add a city or use your location, then try again.");
      return;
    }
    setImporting(true); setImportMsg(null);
    try {
      const res = await livePlaces({
        data: {
          query: baseQuery,
          city: search.city || undefined,
          category: cat,
          lat: coords?.lat,
          lng: coords?.lng,
          radiusKm: coords ? 25 : undefined,
        },
      });
      setImportMsg(`Imported ${res.count} real ${res.count === 1 ? "business" : "businesses"} from Google. Refreshing…`);
      // re-trigger the list effect
      navigate({ search: (p: typeof search) => ({ ...p }), replace: true });
    } catch (e) {
      setImportMsg(e instanceof Error ? e.message : "Search failed");
    } finally {
      setImporting(false);
    }
  };

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

                {/* Geolocation flow */}
                {coords ? (
                  <div className="mt-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-xs">
                    <div className="flex items-start gap-2">
                      <Locate className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-foreground truncate" title={coordsLabel ?? undefined}>{coordsLabel ?? "Location set"}</div>
                        <div className="text-muted-foreground mt-0.5">
                          {coordsSource === "gps" ? "From your device" : "Manual entry"} · {search.radius} km radius
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={clearLocation}
                      className="mt-2 w-full inline-flex items-center justify-center gap-1.5 rounded-md border border-destructive/30 bg-destructive/10 px-2 py-1.5 text-[11px] text-destructive hover:bg-destructive/20 transition"
                    >
                      <Trash2 className="h-3 w-3" /> Clear saved location
                    </button>
                  </div>
                ) : geoStatus === "denied" || geoStatus === "unsupported" || geoStatus === "error" ? (
                  <div className="mt-2 space-y-2">
                    <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                      <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      <div>
                        {geoStatus === "denied" && "Location access is blocked. Enter a city or ZIP to filter by radius."}
                        {geoStatus === "unsupported" && "Your browser doesn't support location. Use city or ZIP instead."}
                        {geoStatus === "error" && "We couldn't read your location. Try entering a city or ZIP."}
                      </div>
                    </div>
                    <ManualLocationForm
                      value={manualQuery}
                      onChange={setManualQuery}
                      busy={manualBusy}
                      error={manualError}
                      onApply={() => applyManualLocation()}
                    />
                  </div>
                ) : (
                  <div className="mt-2 space-y-2">
                    <button
                      onClick={useMyLocation}
                      disabled={geoStatus === "prompting"}
                      className="w-full inline-flex items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-md border border-border bg-background hover:bg-secondary/40 transition disabled:opacity-60"
                    >
                      {geoStatus === "prompting" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Locate className="h-3 w-3" />}
                      {geoStatus === "prompting" ? "Waiting for permission…" : "Use my location"}
                    </button>
                    <details className="text-xs">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground select-none">Or enter city / ZIP</summary>
                      <div className="mt-2">
                        <ManualLocationForm
                          value={manualQuery}
                          onChange={setManualQuery}
                          busy={manualBusy}
                          error={manualError}
                          onApply={() => applyManualLocation()}
                        />
                      </div>
                    </details>
                  </div>
                )}

                {coords && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                      <span>Radius</span>
                      <span className="tabular-nums text-foreground">{search.radius} km</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={100}
                      step={1}
                      value={search.radius}
                      onChange={(e) => update({ radius: Number(e.target.value) })}
                      className="accent-primary w-full"
                    />
                  </div>
                )}
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
            <div className="flex items-center justify-between mb-6 text-sm text-muted-foreground gap-3 flex-wrap">
              <div className="inline-flex items-center gap-2">
                <span><span className="text-foreground font-medium">{total}</span> creators{search.city ? <> in <span className="text-foreground">{search.city}</span></> : null}</span>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
              <div className="inline-flex items-center gap-2">
                {coords && (
                  <>
                    <label className="inline-flex items-center gap-2 text-xs">
                      <span>Radius</span>
                      <input type="range" min={1} max={100} step={1} value={search.radius} onChange={(e) => update({ radius: Number(e.target.value) })} className="accent-primary w-28" />
                      <span className="text-foreground tabular-nums w-10 text-right">{search.radius} km</span>
                    </label>
                    <button
                      onClick={clearLocation}
                      title="Clear saved location"
                      className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md border border-destructive/30 text-destructive hover:bg-destructive/10 transition"
                    >
                      <Trash2 className="h-3 w-3" /> Clear
                    </button>
                  </>
                )}
                <div className="inline-flex rounded-md border border-border overflow-hidden">
                  <button onClick={() => update({ view: "grid" })} className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 transition ${search.view === "grid" ? "bg-primary/10 text-primary" : "bg-background hover:bg-secondary/40"}`}>
                    <LayoutGrid className="h-3.5 w-3.5" /> Grid
                  </button>
                  <button onClick={() => update({ view: "map" })} className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 border-l border-border transition ${search.view === "map" ? "bg-primary/10 text-primary" : "bg-background hover:bg-secondary/40"}`}>
                    <MapIcon className="h-3.5 w-3.5" /> Map
                  </button>
                </div>
              </div>
            </div>

            {!loading && results.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
                <p className="text-foreground font-medium">No creators match yet.</p>
                <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                  We only show real, verified businesses. Search public business directories live to import real creators in {search.city || "your area"}.
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-2 justify-center">
                  <button onClick={runLiveSearch} disabled={importing} className="text-sm rounded-md bg-[image:var(--gradient-gold)] text-primary-foreground px-4 py-2 inline-flex items-center gap-1.5 disabled:opacity-60">
                    {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
                    Search Google for real creators
                  </button>
                  <button onClick={reset} className="text-sm rounded-md border border-border px-4 py-2 hover:bg-secondary/40 transition">Reset filters</button>
                  <Link to="/onboarding-listing" className="text-sm rounded-md bg-[image:var(--gradient-gold)] text-primary-foreground px-4 py-2">List your business</Link>
                </div>
                {importMsg && <p className="mt-4 text-xs text-muted-foreground">{importMsg}</p>}
              </div>
            ) : search.view === "map" ? (
              <MarketplaceMap
                listings={results}
                center={coords}
                radiusKm={coords ? search.radius : undefined}
                onSelect={(l) => setSelectedId(l.id)}
                selectedId={selectedId}
              />
            ) : (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {results.map((p) => <Card key={p.id} l={p} />)}
              </div>
            )}
          </div>
        </div>
      </section>
      <SiteFooter />
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

function ManualLocationForm({
  value, onChange, busy, error, onApply,
}: {
  value: string;
  onChange: (v: string) => void;
  busy: boolean;
  error: string | null;
  onApply: () => void;
}) {
  return (
    <div>
      <form
        onSubmit={(e) => { e.preventDefault(); onApply(); }}
        className="flex gap-1.5"
      >
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="City or ZIP (e.g. Mumbai or 400001)"
          className="flex-1 min-w-0 rounded-md bg-background border border-border px-3 py-2 text-xs"
        />
        <button
          type="submit"
          disabled={busy || !value.trim()}
          className="text-xs px-3 py-2 rounded-md bg-[image:var(--gradient-gold)] text-primary-foreground inline-flex items-center gap-1 disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <MapPin className="h-3 w-3" />}
          Apply
        </button>
      </form>
      {error && <p className="mt-1.5 text-[11px] text-amber-300">{error}</p>}
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