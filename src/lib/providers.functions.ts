// Provider connector system. Admins can view/enable/configure partner
// integrations (WedMeGood, BookMyShoot, ZoopGo, Upwork, Freelancer,
// Creativepool) and run imports when credentials are supplied and the
// upstream partner API is enabled.
//
// Credentials live in provider_connectors.credentials (jsonb). The table has
// no RLS policies for regular users — reads/writes go through this module
// under service role after an admin check.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { slugify, type ListingCategory } from "@/lib/listings";

type Cat = ListingCategory;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function assertAdmin(supabase: any, userId: string) {
  const { data } = await supabase
    .from("user_roles").select("role")
    .eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Admin role required");
}

function redact(creds: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of Object.keys(creds ?? {})) {
    const v = String((creds as Record<string, unknown>)[k] ?? "");
    out[k] = v ? `${v.slice(0, 4)}••••${v.slice(-2)}` : "";
  }
  return out;
}

export const listProviderConnectors = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("provider_connectors")
      .select("id, slug, name, enabled, status, credentials, config, notes, last_tested_at, last_error, updated_at")
      .order("name");
    if (error) throw new Error(error.message);
    return {
      connectors: (data ?? []).map((c) => ({
        ...c,
        credentials_masked: redact((c.credentials ?? {}) as Record<string, unknown>),
        credentials: undefined,
      })),
    };
  });

const UpsertInput = z.object({
  slug: z.string().min(2).max(60),
  enabled: z.boolean().optional(),
  credentials: z.record(z.string(), z.string()).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  notes: z.string().max(2000).optional(),
});

export const upsertProviderConnector = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => UpsertInput.parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: {
      enabled?: boolean;
      notes?: string;
      config?: Record<string, unknown>;
      credentials?: Record<string, string>;
      status?: string;
    } = {};
    if (data.enabled !== undefined) patch.enabled = data.enabled;
    if (data.notes !== undefined) patch.notes = data.notes;
    if (data.config !== undefined) patch.config = data.config;
    if (data.credentials !== undefined) {
      patch.credentials = data.credentials;
      patch.status = Object.values(data.credentials).some(Boolean) ? "ready" : "not_configured";
    }
    const { error } = await supabaseAdmin
      .from("provider_connectors")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update(patch as any)
      .eq("slug", data.slug);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// --- Partner import adapters -----------------------------------------------

type ImportedListing = { external_id: string; business_name: string; city?: string | null; website?: string | null; phone?: string | null; cover_url?: string | null; categories: Cat[] };

type AdapterResult = { imported: ImportedListing[]; error?: string };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type Adapter = (opts: { creds: Record<string, string>; config: Record<string, unknown>; city?: string; category?: Cat; query?: string }) => Promise<AdapterResult>;

const notImplemented = (name: string): Adapter => async () => ({ imported: [], error: `${name} has no public partner API. Provide official partner credentials + a working endpoint before enabling.` });

const upworkAdapter: Adapter = async ({ creds, query, category }) => {
  const token = creds.access_token;
  if (!token) return { imported: [], error: "Missing access_token for Upwork" };
  // Upwork public search API (v2 GraphQL) — requires approved partner key.
  const q = [query, category].filter(Boolean).join(" ") || "photographer";
  const res = await fetch("https://api.upwork.com/api/profiles/v2/search/freelancers.json?q=" + encodeURIComponent(q), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return { imported: [], error: `Upwork ${res.status}: ${(await res.text()).slice(0, 200)}` };
  const json = await res.json() as { providers?: { providers?: Array<{ ciphertext?: string; freelancer_name?: string; profile_url?: string; portrait_100?: string; country?: string; skills?: string[] }> } };
  const items = json.providers?.providers ?? [];
  const imported: ImportedListing[] = items.map((p) => ({
    external_id: `upwork:${p.ciphertext ?? p.freelancer_name}`,
    business_name: p.freelancer_name ?? "Upwork freelancer",
    city: p.country ?? null,
    website: p.profile_url ?? null,
    cover_url: p.portrait_100 ?? null,
    categories: [category ?? "photographer"],
  }));
  return { imported };
};

const freelancerAdapter: Adapter = async ({ creds, query, category }) => {
  const token = creds.access_token;
  if (!token) return { imported: [], error: "Missing access_token for Freelancer" };
  const q = query || (category ?? "photographer");
  const url = `https://www.freelancer.com/api/users/0.1/users/directory/?query=${encodeURIComponent(q)}&limit=25`;
  const res = await fetch(url, { headers: { "Freelancer-OAuth-V1": token } });
  if (!res.ok) return { imported: [], error: `Freelancer ${res.status}: ${(await res.text()).slice(0, 200)}` };
  const json = await res.json() as { result?: { users?: Record<string, { username?: string; display_name?: string; location?: { country?: { name?: string } }; avatar?: string }> } };
  const users = Object.values(json.result?.users ?? {});
  const imported: ImportedListing[] = users.map((u) => ({
    external_id: `freelancer:${u.username ?? u.display_name}`,
    business_name: u.display_name ?? u.username ?? "Freelancer user",
    city: u.location?.country?.name ?? null,
    website: u.username ? `https://www.freelancer.com/u/${u.username}` : null,
    cover_url: u.avatar ?? null,
    categories: [category ?? "photographer"],
  }));
  return { imported };
};

const ADAPTERS: Record<string, Adapter> = {
  upwork: upworkAdapter,
  freelancer: freelancerAdapter,
  wedmegood: notImplemented("WedMeGood"),
  bookmyshoot: notImplemented("BookMyShoot"),
  zoopgo: notImplemented("ZoopGo"),
  creativepool: notImplemented("Creativepool"),
};

const RunInput = z.object({
  slug: z.string().min(2).max(60),
  query: z.string().max(120).optional(),
  city: z.string().max(80).optional(),
  category: z.enum(["photographer", "videographer", "editor"]).optional(),
});

export const runProviderImport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => RunInput.parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: conn } = await supabaseAdmin
      .from("provider_connectors")
      .select("slug, enabled, credentials, config")
      .eq("slug", data.slug)
      .maybeSingle();
    if (!conn) throw new Error("Provider not found");
    if (!conn.enabled) throw new Error("Provider is not enabled");
    const adapter = ADAPTERS[conn.slug];
    if (!adapter) throw new Error("No adapter for this provider");

    const { data: job } = await supabaseAdmin
      .from("import_jobs")
      .insert({
        provider: conn.slug, job_type: "partner", status: "running",
        triggered_by: context.userId, input: data,
      })
      .select("id").single();

    let importedCount = 0;
    let errMsg: string | undefined;
    try {
      const r = await adapter({
        creds: (conn.credentials ?? {}) as Record<string, string>,
        config: (conn.config ?? {}) as Record<string, unknown>,
        query: data.query, city: data.city, category: data.category,
      });
      errMsg = r.error;
      for (const item of r.imported) {
        const baseSlug = slugify(item.business_name) || "creator";
        const suffix = item.external_id.split(":").pop() ?? Math.random().toString(36).slice(2, 8);
        const slug = `${baseSlug}-${suffix.toLowerCase().slice(-6)}`;
        const payload = {
          slug,
          source: "google_places" as const, // reuse enum until a partner value is added
          business_name: item.business_name,
          display_name: item.business_name,
          categories: item.categories,
          city: item.city ?? null,
          country: null,
          website: item.website ?? null,
          phone: item.phone ?? null,
          cover_url: item.cover_url ?? null,
          is_published: true,
        };
        const { error } = await supabaseAdmin
          .from("creator_listings")
          .upsert(payload, { onConflict: "slug" });
        if (!error) importedCount++;
      }
    } catch (err) {
      errMsg = err instanceof Error ? err.message : "Adapter crashed";
    }

    const status = errMsg && importedCount === 0 ? "failed" : errMsg ? "partial" : "success";
    if (job?.id) {
      await supabaseAdmin
        .from("import_jobs")
        .update({
          status, total_imported: importedCount,
          results: [{ city: data.city ?? "any", category: data.category ?? "any", imported: importedCount, skipped: errMsg }],
          error: errMsg ?? null,
          finished_at: new Date().toISOString(),
        })
        .eq("id", job.id);
    }
    if (errMsg && importedCount === 0) {
      await supabaseAdmin
        .from("provider_connectors")
        .update({ status: "error", last_tested_at: new Date().toISOString(), last_error: errMsg })
        .eq("slug", conn.slug);
    } else {
      await supabaseAdmin
        .from("provider_connectors")
        .update({ status: "ready", last_tested_at: new Date().toISOString(), last_error: null })
        .eq("slug", conn.slug);
    }

    return { imported: importedCount, error: errMsg };
  });