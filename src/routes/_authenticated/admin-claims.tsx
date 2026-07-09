import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Check, X, ExternalLink, Search } from "lucide-react";
import { DashShell } from "@/components/dash-shell";
import { pendingClaims, reviewClaim } from "@/lib/claims.functions";
import { searchAndImportPlaces } from "@/lib/places.functions";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/admin-claims")({
  head: () => ({ meta: [{ title: "Admin · Claims & Places Import" }] }),
  component: AdminClaims,
});

type Claim = Awaited<ReturnType<typeof pendingClaims>>["claims"][number];

function AdminClaims() {
  const { roles } = useAuth();
  const isAdmin = roles.includes("admin");
  const list = useServerFn(pendingClaims);
  const review = useServerFn(reviewClaim);
  const importPlaces = useServerFn(searchAndImportPlaces);

  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    list().then((r) => setClaims(r.claims as Claim[])).finally(() => setLoading(false));
  }, [list]);

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

  if (!isAdmin) {
    return <DashShell title="Admin only"><p className="text-muted-foreground">You need the admin role to view this page.</p></DashShell>;
  }

  return (
    <DashShell title="Claims & live imports" subtitle="Review business ownership claims and import real businesses from Google Places.">
      <div className="grid gap-8">
        <section className="rounded-2xl border border-border bg-card/60 p-6">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-4">Import from Google Places</div>
          <form onSubmit={runImport} className="grid sm:grid-cols-[1fr_1fr_auto_auto] gap-2">
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