import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Camera } from "lucide-react";
import { DashShell } from "@/components/dash-shell";
import { upsertOwnListing, getOwnListing } from "@/lib/listings.functions";
import {
  PHOTOGRAPHER_SPECIALTIES,
  VIDEOGRAPHER_SPECIALTIES,
  EDITOR_SPECIALTIES,
  type ListingCategory,
} from "@/lib/listings";

export const Route = createFileRoute("/_authenticated/onboarding-listing")({
  head: () => ({
    meta: [
      { title: "List your business — real creator onboarding" },
      { name: "description", content: "Publish a real photographer, videographer or editor listing." },
    ],
  }),
  component: OnboardingListing,
});

type Cats = ListingCategory[];

function OnboardingListing() {
  const navigate = useNavigate();
  const save = useServerFn(upsertOwnListing);
  const fetchOwn = useServerFn(getOwnListing);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [id, setId] = useState<string | undefined>();

  const [businessName, setBusinessName] = useState("");
  const [tagline, setTagline] = useState("");
  const [bio, setBio] = useState("");
  const [cats, setCats] = useState<Cats>(["photographer"]);
  const [specs, setSpecs] = useState<string[]>([]);
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [instagram, setInstagram] = useState("");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [responseHours, setResponseHours] = useState<string>("24");
  const [coverUrl, setCoverUrl] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    fetchOwn()
      .then((r) => {
        if (r.listing) {
          const l = r.listing;
          setId(l.id);
          setBusinessName(l.business_name ?? "");
          setTagline(l.tagline ?? "");
          setBio(l.bio ?? "");
          setCats((l.categories?.length ? l.categories : ["photographer"]) as Cats);
          setSpecs(l.specialties ?? []);
          setCity(l.city ?? "");
          setState(l.state ?? "");
          setPhone(l.phone ?? "");
          setEmail(l.email ?? "");
          setWebsite(l.website ?? "");
          setInstagram(l.instagram ?? "");
          setMinPrice(l.min_price_inr?.toString() ?? "");
          setMaxPrice(l.max_price_inr?.toString() ?? "");
          setResponseHours(l.response_time_hours?.toString() ?? "24");
          setCoverUrl(l.cover_url ?? "");
          setAvatarUrl(l.avatar_url ?? "");
        }
      })
      .finally(() => setLoading(false));
  }, [fetchOwn]);

  const allSpecs = (() => {
    const set = new Set<string>();
    if (cats.includes("photographer")) PHOTOGRAPHER_SPECIALTIES.forEach((s) => set.add(s));
    if (cats.includes("videographer")) VIDEOGRAPHER_SPECIALTIES.forEach((s) => set.add(s));
    if (cats.includes("editor")) EDITOR_SPECIALTIES.forEach((s) => set.add(s));
    return [...set];
  })();

  const toggle = <T,>(arr: T[], v: T): T[] =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cats.length === 0) return toast.error("Pick at least one category");
    if (!businessName.trim() || !city.trim()) return toast.error("Business name and city are required");
    setSaving(true);
    try {
      const res = await save({
        data: {
          id,
          business_name: businessName.trim(),
          tagline: tagline.trim() || undefined,
          bio: bio.trim() || undefined,
          categories: cats,
          specialties: specs,
          city: city.trim(),
          state: state.trim() || undefined,
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          website: website.trim() || undefined,
          instagram: instagram.trim() || undefined,
          min_price_inr: minPrice ? parseInt(minPrice, 10) : undefined,
          max_price_inr: maxPrice ? parseInt(maxPrice, 10) : undefined,
          response_time_hours: responseHours ? parseInt(responseHours, 10) : undefined,
          cover_url: coverUrl.trim() || undefined,
          avatar_url: avatarUrl.trim() || undefined,
        },
      });
      toast.success(id ? "Listing updated" : "Listing published");
      navigate({ to: "/creators/$handle", params: { handle: res.slug } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashShell title="List your business">
        <div className="grid place-items-center py-20"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      </DashShell>
    );
  }

  return (
    <DashShell title={id ? "Edit your listing" : "List your business"} subtitle="Publish a real profile customers can discover and book.">
      <form onSubmit={submit} className="max-w-3xl space-y-8">
        <Section title="Basics">
          <Field label="Business name *"><input className={inputCls} value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Acme Studios" required /></Field>
          <Field label="Tagline"><input className={inputCls} value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Weddings & lifestyle in Mumbai" /></Field>
          <Field label="About"><textarea className={`${inputCls} min-h-32`} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell customers about your style, experience and process." /></Field>
        </Section>

        <Section title="Categories">
          <div className="flex flex-wrap gap-2">
            {(["photographer", "videographer", "editor"] as const).map((c) => (
              <button type="button" key={c} onClick={() => setCats(toggle(cats, c) as Cats)} className={chip(cats.includes(c))}>
                <Camera className="h-3.5 w-3.5" /> {c}
              </button>
            ))}
          </div>
          {allSpecs.length > 0 && (
            <div className="mt-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Specialties</div>
              <div className="flex flex-wrap gap-1.5">
                {allSpecs.map((s) => (
                  <button type="button" key={s} onClick={() => setSpecs(toggle(specs, s))} className={chip(specs.includes(s))}>{s}</button>
                ))}
              </div>
            </div>
          )}
        </Section>

        <Section title="Location">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="City *"><input className={inputCls} value={city} onChange={(e) => setCity(e.target.value)} required /></Field>
            <Field label="State"><input className={inputCls} value={state} onChange={(e) => setState(e.target.value)} /></Field>
          </div>
        </Section>

        <Section title="Contact">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Phone"><input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
            <Field label="Business email"><input type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
            <Field label="Website"><input type="url" className={inputCls} value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" /></Field>
            <Field label="Instagram"><input className={inputCls} value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@handle" /></Field>
          </div>
        </Section>

        <Section title="Pricing & response time">
          <div className="grid sm:grid-cols-3 gap-3">
            <Field label="Starting price (₹)"><input type="number" min={0} className={inputCls} value={minPrice} onChange={(e) => setMinPrice(e.target.value)} /></Field>
            <Field label="Max price (₹)"><input type="number" min={0} className={inputCls} value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} /></Field>
            <Field label="Response time (hours)"><input type="number" min={1} max={168} className={inputCls} value={responseHours} onChange={(e) => setResponseHours(e.target.value)} /></Field>
          </div>
        </Section>

        <Section title="Media">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Cover image URL"><input type="url" className={inputCls} value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="https://" /></Field>
            <Field label="Avatar URL"><input type="url" className={inputCls} value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://" /></Field>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Add portfolio images later from the Creator dashboard.</p>
        </Section>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving} className="rounded-md bg-[image:var(--gradient-gold)] text-primary-foreground px-5 py-2.5 text-sm font-medium disabled:opacity-50">
            {saving ? "Publishing…" : id ? "Save changes" : "Publish listing"}
          </button>
        </div>
      </form>
    </DashShell>
  );
}

const inputCls = "w-full rounded-md bg-background border border-border px-3 py-2 text-sm";
const chip = (on: boolean) =>
  `inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition ${on ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-background hover:bg-secondary/40 text-muted-foreground"}`;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card/60 p-6">
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-4">{title}</div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="block text-xs text-muted-foreground mb-1.5">{label}</span>
      {children}
    </label>
  );
}