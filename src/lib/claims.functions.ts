// Claim flow: a real business owner claims an unclaimed Google-Places-imported
// listing. Admins review submissions and either approve (which transfers
// ownership and flips source -> 'claimed') or reject.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const SubmitInput = z.object({
  listingId: z.string().uuid(),
  businessEmail: z.string().email().max(120).optional(),
  proofUrl: z.string().url().max(500).optional(),
  notes: z.string().max(1000).optional(),
});

export const submitClaim = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => SubmitInput.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (!data.businessEmail && !data.proofUrl) {
      throw new Error("Provide a business email or a proof document URL.");
    }
    const { data: listing } = await supabase
      .from("creator_listings")
      .select("id, owner_user_id, source")
      .eq("id", data.listingId)
      .maybeSingle();
    if (!listing) throw new Error("Listing not found");
    if (listing.owner_user_id) throw new Error("This listing has already been claimed.");

    const { error } = await supabase
      .from("claim_requests")
      .upsert(
        {
          listing_id: data.listingId,
          claimant_user_id: userId,
          business_email: data.businessEmail ?? null,
          proof_url: data.proofUrl ?? null,
          notes: data.notes ?? null,
          status: "pending",
        },
        { onConflict: "listing_id,claimant_user_id" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const myClaims = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("claim_requests")
      .select("id, status, created_at, rejection_reason, listing_id, listings:creator_listings(business_name, slug, city)")
      .eq("claimant_user_id", userId)
      .order("created_at", { ascending: false });
    return { claims: data ?? [] };
  });

const ReviewInput = z.object({
  claimId: z.string().uuid(),
  decision: z.enum(["approve", "reject"]),
  reason: z.string().max(300).optional(),
});

export const reviewClaim = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => ReviewInput.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // Admin check
    const { data: roleRow } = await supabase
      .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
    if (!roleRow) throw new Error("Admin only");

    const { data: claim } = await supabaseAdmin
      .from("claim_requests")
      .select("id, listing_id, claimant_user_id, status")
      .eq("id", data.claimId)
      .maybeSingle();
    if (!claim) throw new Error("Claim not found");
    if (claim.status !== "pending") throw new Error("Claim already reviewed");

    if (data.decision === "approve") {
      await supabaseAdmin
        .from("creator_listings")
        .update({
          owner_user_id: claim.claimant_user_id,
          source: "claimed",
          verification_status: "business_verified",
        })
        .eq("id", claim.listing_id);
      // Reject any other pending claims on this listing
      await supabaseAdmin
        .from("claim_requests")
        .update({ status: "rejected", rejection_reason: "Another claim was approved", reviewed_by: userId, reviewed_at: new Date().toISOString() })
        .eq("listing_id", claim.listing_id).neq("id", claim.id).eq("status", "pending");
    }

    await supabaseAdmin
      .from("claim_requests")
      .update({
        status: data.decision === "approve" ? "approved" : "rejected",
        rejection_reason: data.reason ?? null,
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", data.claimId);

    // Notify the claimant
    await supabaseAdmin.from("notifications").insert({
      user_id: claim.claimant_user_id,
      kind: "claim",
      title: data.decision === "approve" ? "Your listing claim was approved" : "Your listing claim was rejected",
      body: data.reason ?? null,
      link: "/app",
    });

    return { ok: true };
  });

export const pendingClaims = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: roleRow } = await supabase
      .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
    if (!roleRow) return { claims: [] };

    const { data } = await supabaseAdmin
      .from("claim_requests")
      .select("id, status, business_email, proof_url, notes, created_at, claimant_user_id, listing_id, listings:creator_listings(business_name, slug, city, website, phone)")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    return { claims: data ?? [] };
  });