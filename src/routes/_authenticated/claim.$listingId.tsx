import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";
import { DashShell } from "@/components/dash-shell";
import { submitClaim } from "@/lib/claims.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/claim/$listingId")({
  head: () => ({ meta: [{ title: "Claim your business listing" }] }),
  component: ClaimPage,
});

function ClaimPage() {
  const { listingId } = Route.useParams();
  const navigate = useNavigate();
  const submit = useServerFn(submitClaim);

  const [name, setName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [businessEmail, setEmail] = useState("");
  const [proofUrl, setProof] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.from("creator_listings").select("business_name, slug, owner_user_id").eq("id", listingId).maybeSingle().then(({ data }) => {
      setName(data?.business_name ?? null);
      setLoading(false);
    });
  }, [listingId]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessEmail && !proofUrl) return toast.error("Provide a business email or document URL.");
    setBusy(true);
    try {
      await submit({ data: { listingId, businessEmail: businessEmail || undefined, proofUrl: proofUrl || undefined, notes: notes || undefined } });
      toast.success("Claim submitted — we'll review within 1–2 business days.");
      navigate({ to: "/app" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit claim");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <DashShell title="Claim listing"><div className="grid place-items-center py-20"><Loader2 className="h-5 w-5 animate-spin" /></div></DashShell>;
  }

  return (
    <DashShell title={name ? `Claim ${name}` : "Claim listing"} subtitle="Verify you're the owner to manage bookings, prices and photos.">
      <form onSubmit={send} className="max-w-2xl space-y-6">
        <div className="rounded-2xl border border-border bg-card/60 p-6 space-y-4">
          <div className="flex items-start gap-3 text-sm">
            <ShieldCheck className="h-4 w-4 text-primary mt-0.5" />
            <p className="text-muted-foreground">Provide at least one of the following. Our team verifies every claim manually.</p>
          </div>
          <Field label="Business email (must match domain on Google/website)">
            <input type="email" className={inputCls} value={businessEmail} onChange={(e) => setEmail(e.target.value)} placeholder="owner@yourbusiness.com" />
          </Field>
          <Field label="Proof document URL (GST cert, utility bill, business reg.)">
            <input type="url" className={inputCls} value={proofUrl} onChange={(e) => setProof(e.target.value)} placeholder="https://drive.google.com/..." />
          </Field>
          <Field label="Additional context (optional)">
            <textarea className={`${inputCls} min-h-24`} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything that helps us verify quickly." />
          </Field>
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" disabled={busy} className="rounded-md bg-[image:var(--gradient-gold)] text-primary-foreground px-5 py-2.5 text-sm font-medium disabled:opacity-50">
            {busy ? "Submitting…" : "Submit claim"}
          </button>
          <Link to="/marketplace" className="text-sm text-muted-foreground hover:text-foreground">Cancel</Link>
        </div>
      </form>
    </DashShell>
  );
}

const inputCls = "w-full rounded-md bg-background border border-border px-3 py-2 text-sm";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-sm"><span className="block text-xs text-muted-foreground mb-1.5">{label}</span>{children}</label>;
}