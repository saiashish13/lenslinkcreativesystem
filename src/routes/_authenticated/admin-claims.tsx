import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Check, X, ExternalLink, Search, History, Plug, Play, Save } from "lucide-react";
import { DashShell } from "@/components/dash-shell";
import { pendingClaims, reviewClaim } from "@/lib/claims.functions";
import { searchAndImportPlaces, bulkImportPlaces } from "@/lib/places.functions";
import { listImportJobs } from "@/lib/imports.functions";
import { listProviderConnectors, upsertProviderConnector, runProviderImport } from "@/lib/providers.functions";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/admin-claims")({
  head: () => ({ meta: [{ title: "Admin · Claims & Places Import" }] }),
  component: AdminClaims,
});

type Claim = Awaited<ReturnType<typeof pendingClaims>>["claims"][number];
type Job = Awaited<ReturnType<typeof listImportJobs>>["jobs"][number];
type Connector = Awaited<ReturnType<typeof listProviderConnectors>>["connectors"][number];

function AdminClaims() {
  const { roles } = useAuth();
  const isAdmin = roles.includes("admin");
  const list = useServerFn(pendingClaims);
  const review = useServerFn(reviewClaim);
  const importPlaces = useServerFn(searchAndImportPlaces);
  const bulkImport = useServerFn(bulkImportPlaces);
  const listJobs = useServerFn(listImportJobs);
  const listProviders = useServerFn(listProviderConnectors);
  const saveProvider = useServerFn(upsertProviderConnector);
  const runProvider = useServerFn(runProviderImport);

  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [connectors, setConnectors] = useState<Connector[]>([]);

  const refresh = useCallback(() => {
    setLoading(true);
    Promise.all([
      list().then((r) => setClaims(r.claims as Claim[])),
      listJobs().then((r) => setJobs(r.jobs as Job[])),
      listProviders().then((r) => setConnectors(r.connectors as Connector[])),
    ]).finally(() => setLoading(false));
  }, [list, listJobs, listProviders]);

  useEffect(() => { if (isAdmin) refresh(); else setLoading(false); }, [isAdmin, refresh]);

  const act = async (id: string, decision: "approve" | "reject") => {
    const reason = decision === "reject" ? prompt("Reason for rejection?") ?? undefined : undefined;
    try {
      await review({ data: { claimId: id, decision, reason } });
      toast.success(`Claim ${decision}d`);
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [cat, setCat] = useState<"photographer" | "videographer" | "editor">("photographer");
  const [importing, setImporting] = useState(false);
  const runImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setImporting(true);
    try {
      const r = await importPlaces({ data: { query: q, city: city || undefined, category: cat } });
      toast.success(`Imported ${r.count} listings`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const [bulkQuery, setBulkQuery] = useState("wedding");
  const [bulkCities, setBulkCities] = useState("Mumbai, Delhi, Bangalore, Hyderabad, Chennai, Pune, Kolkata, Ahmedabad, Jaipur, Goa");
  const [bulkCats, setBulkCats] = useState<Record<"photographer" | "videographer" | "editor", boolean>>({
    photographer: true,
    videographer: true,
    editor: false,
  });
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkResults, setBulkResults] = useState<{ totalImported: number; results: Array<{ city: string; category: string; imported: number; skipped?: string }> } | null>(null);

  const runBulk = async (e: React.FormEvent) => {
    e.preventDefault();
    const cities = bulkCities.split(",").map((s) => s.trim()).filter(Boolean);
    const categories = (Object.keys(bulkCats) as Array<keyof typeof bulkCats>).filter((k) => bulkCats[k]);
    if (!cities.length || !categories.length) {
      toast.error("Pick at least one city and one category");
      return;
    }
    setBulkRunning(true);
    setBulkResults(null);
    try {
      const r = await bulkImport({ data: { query: bulkQuery, cities, categories } });
      setBulkResults(r);
      toast.success(`Imported ${r.totalImported} listings across ${r.results.length} combos`);
      listJobs().then((res) => setJobs(res.jobs as Job[]));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bulk import failed");
    } finally {
      setBulkRunning(false);
    }
  };

  const wrappedRunImport = async (e: React.FormEvent) => {
    await runImport(e);
    listJobs().then((res) => setJobs(res.jobs as Job[]));
  };

  if (!isAdmin) {
    return <DashShell title="Admin only"><p className="text-muted-foreground">You need the admin role to view this page.</p></DashShell>;
  }

  return (
    <DashShell title="Claims & live imports" subtitle="Review business ownership claims and import real businesses from Google Places.">
      <div className="grid gap-8">
        <section className="rounded-2xl border border-border bg-card/60 p-6">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-4">Import from Google Places</div>
          <form onSubmit={wrappedRunImport} className="grid sm:grid-cols-[1fr_1fr_auto_auto] gap-2">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search query (e.g. wedding photographers)" className="rounded-md border border-border bg-background px-3 py-2 text-sm" required minLength={2} />
            <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City (optional)" className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
            <select value={cat} onChange={(e) => setCat(e.target.value as typeof cat)} className="rounded-md border border-border bg-background px-3 py-2 text-sm">
              <option value="photographer">Photographer</option>
              <option value="videographer">Videographer</option>
              <option value="editor">Editor</option>
            </select>
            <button type="submit" disabled={importing} className="rounded-md bg-[image:var(--gradient-gold)] text-primary-foreground px-4 py-2 text-sm inline-flex items-center gap-1.5 disabled:opacity-50">
              {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Import
            </button>
          </form>
          <p className="text-xs text-muted-foreground mt-3">Rate-limited to 30 imports/hour. Results are deduped by Google place ID.</p>
        </section>

        <section className="rounded-2xl border border-border bg-card/60 p-6">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-4">Bulk import — many cities × categories</div>
          <form onSubmit={runBulk} className="grid gap-3">
            <div className="grid sm:grid-cols-[200px_1fr] gap-2">
              <input value={bulkQuery} onChange={(e) => setBulkQuery(e.target.value)} placeholder="Base query (e.g. wedding)" className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
              <input value={bulkCities} onChange={(e) => setBulkCities(e.target.value)} placeholder="Cities, comma-separated" className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              {(["photographer", "videographer", "editor"] as const).map((c) => (
                <label key={c} className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={bulkCats[c]} onChange={(e) => setBulkCats((s) => ({ ...s, [c]: e.target.checked }))} />
                  {c}
                </label>
              ))}
              <button type="submit" disabled={bulkRunning} className="ml-auto rounded-md bg-[image:var(--gradient-gold)] text-primary-foreground px-4 py-2 text-sm inline-flex items-center gap-1.5 disabled:opacity-50">
                {bulkRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Run bulk import
              </button>
            </div>
          </form>
          <p className="text-xs text-muted-foreground mt-3">Runs one Google Places query per city × category. Each counts against the 30/hour limit; extra combos are skipped and reported.</p>
          {bulkResults && (
            <div className="mt-4 rounded-lg border border-border bg-background/60 p-3 max-h-64 overflow-auto text-xs">
              <div className="mb-2 font-medium">Total imported: {bulkResults.totalImported}</div>
              <table className="w-full">
                <thead className="text-muted-foreground"><tr><th className="text-left font-normal py-1">City</th><th className="text-left font-normal py-1">Category</th><th className="text-right font-normal py-1">Imported</th><th className="text-left font-normal py-1 pl-3">Note</th></tr></thead>
                <tbody>
                  {bulkResults.results.map((r, i) => (
                    <tr key={i} className="border-t border-border/60"><td className="py-1">{r.city}</td><td className="py-1">{r.category}</td><td className="py-1 text-right">{r.imported}</td><td className="py-1 pl-3 text-muted-foreground">{r.skipped ?? "ok"}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section>
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-4">Pending claims ({claims.length})</div>
          {loading ? (
            <div className="grid place-items-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : claims.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">No pending claims.</div>
          ) : (
            <div className="space-y-3">
              {claims.map((c) => {
                const listing = (c as unknown as { listings?: { business_name?: string; slug?: string; city?: string; website?: string | null; phone?: string | null } }).listings;
                return (
                  <div key={c.id} className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium">{listing?.business_name ?? "Unknown listing"}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{listing?.city ?? "—"} · submitted {new Date(c.created_at).toLocaleDateString()}</div>
                        {listing?.slug && (
                          <Link to="/creators/$handle" params={{ handle: listing.slug }} className="text-xs text-primary inline-flex items-center gap-1 mt-1">
                            View profile <ExternalLink className="h-3 w-3" />
                          </Link>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => act(c.id, "approve")} className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25">
                          <Check className="h-3.5 w-3.5" /> Approve
                        </button>
                        <button onClick={() => act(c.id, "reject")} className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-md bg-red-500/15 text-red-300 border border-red-500/30 hover:bg-red-500/25">
                          <X className="h-3.5 w-3.5" /> Reject
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 grid sm:grid-cols-2 gap-3 text-sm">
                      {c.business_email && <Info label="Claim email">{c.business_email}</Info>}
                      {c.proof_url && <Info label="Proof"><a href={c.proof_url} target="_blank" rel="noopener" className="text-primary inline-flex items-center gap-1">Open <ExternalLink className="h-3 w-3" /></a></Info>}
                      {listing?.website && <Info label="Listing site"><a href={listing.website} target="_blank" rel="noopener" className="text-primary truncate inline-block max-w-full">{listing.website.replace(/^https?:\/\//, "")}</a></Info>}
                      {listing?.phone && <Info label="Listing phone">{listing.phone}</Info>}
                      {c.notes && <div className="sm:col-span-2"><Info label="Notes">{c.notes}</Info></div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </DashShell>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm">{children}</div>
    </div>
  );
}