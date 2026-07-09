// Temporary admin seeding endpoint: imports real Google Places listings across
// major Indian cities and creator categories. Protected by SUPABASE_PUBLISHABLE_KEY.
import { createFileRoute } from "@tanstack/react-router";
import { runPlacesImport } from "@/lib/places.functions";

const CITIES = [
  "Mumbai","Delhi","Bengaluru","Chennai","Kolkata","Hyderabad",
  "Pune","Jaipur","Ahmedabad","Goa","Chandigarh","Lucknow","Kochi","Indore",
];
const CATS = ["photographer","videographer","editor"] as const;

export const Route = createFileRoute("/api/public/seed-places")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apikey = request.headers.get("apikey");
        if (apikey !== process.env.SUPABASE_PUBLISHABLE_KEY) {
          return new Response("unauthorized", { status: 401 });
        }
        const url = new URL(request.url);
        const only = url.searchParams.get("category");
        const cats = only ? [only] : CATS;
        const results: Array<{ city: string; category: string; count: number; error?: string }> = [];
        let total = 0;
        for (const city of CITIES) {
          for (const category of cats) {
            try {
              const r = await runPlacesImport({
                query: category,
                city,
                category: category as (typeof CATS)[number],
              });
              total += r.count;
              results.push({ city, category, count: r.count });
            } catch (e) {
              results.push({ city, category, count: 0, error: e instanceof Error ? e.message : String(e) });
            }
          }
        }
        return Response.json({ total, results });
      },
    },
  },
});
