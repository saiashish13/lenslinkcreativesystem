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

        <JobHistorySection jobs={jobs} onRefresh={() => listJobs().then((r) => setJobs(r.jobs as Job[]))} />

        <ProviderConnectorsSection
          connectors={connectors}
          onSave={async (slug: string, patch: Partial<{ enabled: boolean; credentials: Record<string, string>; notes: string }>) => {
            await saveProvider({ data: { slug, ...patch } });
            const r = await listProviders();
            setConnectors(r.connectors as Connector[]);
          }}
          onRun={async (slug: string, opts: { query?: string; city?: string; category?: "photographer" | "videographer" | "editor" }) => {
            const r = await runProvider({ data: { slug, ...opts } });
            if (r.error) toast.warning(`Imported ${r.imported} · ${r.error}`);
            else toast.success(`Imported ${r.imported}`);
            const rc = await listProviders();
            setConnectors(rc.connectors as Connector[]);
            listJobs().then((jr) => setJobs(jr.jobs as Job[]));
          }}
        />

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

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    success: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    partial: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    failed: "bg-red-500/15 text-red-300 border-red-500/30",
    running: "bg-sky-500/15 text-sky-300 border-sky-500/30",
    ready: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    not_configured: "bg-muted text-muted-foreground border-border",
    error: "bg-red-500/15 text-red-300 border-red-500/30",
    unsupported: "bg-muted text-muted-foreground border-border",
  };
  return <span className={`inline-block text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${map[status] ?? map.not_configured}`}>{status.replace("_", " ")}</span>;
}

function JobHistorySection({ jobs, onRefresh }: { jobs: Job[]; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  return (
    <section className="rounded-2xl border border-border bg-card/60 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs uppercase tracking-wider text-muted-foreground inline-flex items-center gap-2"><History className="h-3.5 w-3.5" /> Import job history & audit log</div>
        <button onClick={onRefresh} className="text-xs text-muted-foreground hover:text-foreground">Refresh</button>
      </div>
      {jobs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No import jobs recorded yet.</div>
      ) : (
        <div className="text-xs">
          <table className="w-full">
            <thead className="text-muted-foreground">
              <tr>
                <th className="text-left font-normal py-1.5">When</th>
                <th className="text-left font-normal py-1.5">Provider</th>
                <th className="text-left font-normal py-1.5">Type</th>
                <th className="text-left font-normal py-1.5">Status</th>
                <th className="text-right font-normal py-1.5">Imported</th>
                <th className="text-left font-normal py-1.5 pl-3">Triggered by</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => {
                const results = (j.results ?? []) as Array<{ city?: string; category?: string; imported?: number; skipped?: string }>;
                const isOpen = expanded === j.id;
                return (
                  <>
                    <tr key={j.id} className="border-t border-border/60">
                      <td className="py-1.5">{new Date(j.started_at).toLocaleString()}</td>
                      <td className="py-1.5">{j.provider}</td>
                      <td className="py-1.5">{j.job_type}</td>
                      <td className="py-1.5"><StatusPill status={j.status} /></td>
                      <td className="py-1.5 text-right">{j.total_imported}</td>
                      <td className="py-1.5 pl-3 text-muted-foreground">{j.triggered_by_name}</td>
                      <td className="py-1.5 text-right">
                        <button onClick={() => setExpanded(isOpen ? null : j.id)} className="text-primary hover:underline">{isOpen ? "Hide" : "Details"}</button>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr key={j.id + "d"}>
                        <td colSpan={7} className="pb-3">
                          <div className="rounded-lg border border-border bg-background/60 p-3 space-y-2">
                            {j.error && <div className="text-red-300">Error: {j.error}</div>}
                            <div className="text-muted-foreground">Input: <code className="text-foreground">{JSON.stringify(j.input)}</code></div>
                            {results.length > 0 && (
                              <table className="w-full">
                                <thead className="text-muted-foreground"><tr><th className="text-left font-normal py-1">City</th><th className="text-left font-normal py-1">Category</th><th className="text-right font-normal py-1">Imported</th><th className="text-left font-normal py-1 pl-3">Note</th></tr></thead>
                                <tbody>
                                  {results.map((r, i) => (
                                    <tr key={i} className="border-t border-border/60"><td className="py-1">{r.city ?? "—"}</td><td className="py-1">{r.category ?? "—"}</td><td className="py-1 text-right">{r.imported ?? 0}</td><td className="py-1 pl-3 text-muted-foreground">{r.skipped ?? "ok"}</td></tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function ProviderConnectorsSection({
  connectors,
  onSave,
  onRun,
}: {
  connectors: Connector[];
  onSave: (slug: string, patch: Partial<{ enabled: boolean; credentials: Record<string, string>; notes: string }>) => Promise<void>;
  onRun: (slug: string, opts: { query?: string; city?: string; category?: "photographer" | "videographer" | "editor" }) => Promise<void>;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card/60 p-6">
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-4 inline-flex items-center gap-2"><Plug className="h-3.5 w-3.5" /> Partner API connectors</div>
      <p className="text-xs text-muted-foreground mb-4">Store partner credentials once, then run imports on demand. Only providers marked <b>ready</b> and <b>enabled</b> can be run. Providers marked <b>unsupported</b> have no public partner API — reach out to their business team for a partnership.</p>
      <div className="grid gap-3">
        {connectors.map((c) => (
          <ConnectorRow key={c.slug} c={c} onSave={onSave} onRun={onRun} />
        ))}
      </div>
    </section>
  );
}

function ConnectorRow({
  c,
  onSave,
  onRun,
}: {
  c: Connector;
  onSave: (slug: string, patch: Partial<{ enabled: boolean; credentials: Record<string, string>; notes: string }>) => Promise<void>;
  onRun: (slug: string, opts: { query?: string; city?: string; category?: "photographer" | "videographer" | "editor" }) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [creds, setCreds] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState(c.notes ?? "");
  const [enabled, setEnabled] = useState(c.enabled);
  const [runOpts, setRunOpts] = useState<{ query: string; city: string; category: "photographer" | "videographer" | "editor" }>({ query: "", city: "", category: "photographer" });
  const isUnsupported = c.status === "unsupported";

  const save = async () => {
    setSaving(true);
    try {
      const patch: Partial<{ enabled: boolean; credentials: Record<string, string>; notes: string }> = { enabled, notes };
      if (Object.values(creds).some(Boolean)) patch.credentials = creds;
      await onSave(c.slug, patch);
      toast.success("Saved");
      setCreds({});
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const run = async () => {
    setRunning(true);
    try {
      await onRun(c.slug, { query: runOpts.query || undefined, city: runOpts.city || undefined, category: runOpts.category });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Run failed");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-background/40 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{c.name}</span>
            <StatusPill status={c.status} />
            {c.enabled && <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-primary/40 text-primary">Enabled</span>}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5 truncate">{c.notes ?? "—"}</div>
          {c.last_error && <div className="text-xs text-red-300 mt-1">Last error: {c.last_error}</div>}
        </div>
        <button onClick={() => setOpen(!open)} className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-muted/40">{open ? "Close" : "Configure"}</button>
        <button onClick={run} disabled={running || !c.enabled || isUnsupported} className="text-xs px-3 py-1.5 rounded-md bg-[image:var(--gradient-gold)] text-primary-foreground inline-flex items-center gap-1.5 disabled:opacity-40">
          {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />} Run
        </button>
      </div>
      {open && (
        <div className="mt-4 grid gap-3 border-t border-border pt-4">
          <div className="flex items-center gap-4 text-xs">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} disabled={isUnsupported} />
              Enabled
            </label>
            {Object.entries(c.credentials_masked ?? {}).length > 0 && (
              <span className="text-muted-foreground">Stored: {Object.entries(c.credentials_masked).map(([k, v]) => `${k}=${v}`).join(", ")}</span>
            )}
          </div>
          <div className="grid sm:grid-cols-2 gap-2 text-xs">
            <input placeholder="access_token" value={creds.access_token ?? ""} onChange={(e) => setCreds((s) => ({ ...s, access_token: e.target.value }))} className="rounded-md border border-border bg-background px-3 py-2" />
            <input placeholder="client_id (optional)" value={creds.client_id ?? ""} onChange={(e) => setCreds((s) => ({ ...s, client_id: e.target.value }))} className="rounded-md border border-border bg-background px-3 py-2" />
          </div>
          <textarea placeholder="Notes / setup instructions" value={notes} onChange={(e) => setNotes(e.target.value)} className="rounded-md border border-border bg-background px-3 py-2 text-xs min-h-[60px]" />
          <div className="flex flex-wrap gap-2 text-xs">
            <input placeholder="Run query" value={runOpts.query} onChange={(e) => setRunOpts((s) => ({ ...s, query: e.target.value }))} className="rounded-md border border-border bg-background px-3 py-2 flex-1 min-w-[140px]" />
            <input placeholder="City" value={runOpts.city} onChange={(e) => setRunOpts((s) => ({ ...s, city: e.target.value }))} className="rounded-md border border-border bg-background px-3 py-2 w-32" />
            <select value={runOpts.category} onChange={(e) => setRunOpts((s) => ({ ...s, category: e.target.value as typeof runOpts.category }))} className="rounded-md border border-border bg-background px-3 py-2">
              <option value="photographer">Photographer</option>
              <option value="videographer">Videographer</option>
              <option value="editor">Editor</option>
            </select>
            <button onClick={save} disabled={saving} className="text-xs px-3 py-2 rounded-md border border-border hover:bg-muted/40 inline-flex items-center gap-1.5 disabled:opacity-50">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}