// Import job history + audit log. Any admin-triggered import (single Places
// query, bulk Places sweep, or partner API run) writes a row here so we can
// audit who ran what, when, how many listings landed, and what failed.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Using `any` on purpose: the client type from supabase-js is generic and
// resolving it here hits TS "excessively deep" instantiation errors.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function assertAdmin(supabase: any, userId: string) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Admin role required");
}

export const listImportJobs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: jobs, error } = await supabaseAdmin
      .from("import_jobs")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);

    const ids = Array.from(new Set((jobs ?? []).map((j) => j.triggered_by).filter(Boolean))) as string[];
    let names = new Map<string, string>();
    if (ids.length) {
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name")
        .in("id", ids);
      names = new Map((profiles ?? []).map((p) => [p.id, p.full_name ?? "Unknown"]));
    }

    return {
      jobs: (jobs ?? []).map((j) => ({
        ...j,
        triggered_by_name: j.triggered_by ? names.get(j.triggered_by) ?? "Unknown" : "System",
      })),
    };
  });

const DeleteInput = z.object({ jobId: z.string().uuid() });

export const deleteImportJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => DeleteInput.parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("import_jobs").delete().eq("id", data.jobId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });