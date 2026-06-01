// Nightly cron: refresh the oldest 100 Google-Places-sourced listings to stay
// within Google's 30-day caching policy. Called by pg_cron with the Supabase
// anon key in the `apikey` header.

import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { refreshListingFromPlaces } from "@/lib/places.functions";

export const Route = createFileRoute("/api/public/cron/refresh-places")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apikey = request.headers.get("apikey");
        if (apikey !== process.env.SUPABASE_PUBLISHABLE_KEY) {
          return new Response("unauthorized", { status: 401 });
        }

        const cutoff = new Date(Date.now() - 1000 * 60 * 60 * 24 * 21).toISOString(); // 21 days
        const { data: stale } = await supabaseAdmin
          .from("creator_listings")
          .select("id")
          .eq("source", "google_places")
          .or(`places_last_synced_at.is.null,places_last_synced_at.lt.${cutoff}`)
          .order("places_last_synced_at", { ascending: true, nullsFirst: true })
          .limit(100);

        let refreshed = 0;
        for (const row of stale ?? []) {
          try {
            const res = await refreshListingFromPlaces({ data: { listingId: row.id } });
            if (res.refreshed) refreshed++;
          } catch {
            // continue on individual failure
          }
        }
        return Response.json({ scanned: stale?.length ?? 0, refreshed });
      },
    },
  },
});