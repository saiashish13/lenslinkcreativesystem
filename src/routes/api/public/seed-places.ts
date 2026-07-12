// Temporary admin seeding endpoint: imports real Google Places listings across
// major Indian cities and creator categories. Protected by SUPABASE_PUBLISHABLE_KEY.
import { createFileRoute } from "@tanstack/react-router";
import { runPlacesImport } from "@/lib/places.functions";

const CITIES = [
  "Mumbai","Delhi","Bengaluru","Chennai","Kolkata","Hyderabad",
  "Pune","Jaipur","Ahmedabad","Goa","Chandigarh","Lucknow","Kochi","Indore",
  "Surat","Nagpur","Bhopal","Coimbatore","Visakhapatnam","Vadodara",
  "Gurugram","Noida","Thane","Mysuru","Udaipur","Rishikesh","Shimla","Dehradun",
];
const CATS = ["photographer","videographer","editor"] as const;

const QUERY_VARIANTS: Record<(typeof CATS)[number], string[]> = {
  photographer: [
    "wedding photographer","pre-wedding photographer","fashion photographer",
    "portrait photographer","product photographer","event photographer",
    "maternity photographer","commercial photographer","photography studio",
  ],
  videographer: [
    "wedding videographer","cinematographer","film production",
    "corporate video","event videographer","music video production",
    "drone videographer",
  ],
  editor: [
    "photo editing studio","video editing studio","post production",
    "colour grading","retoucher",
  ],
};

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
        const cats = (only ? [only] : [...CATS]) as (typeof CATS)[number][];
        const results: Array<{ city: string; category: string; query: string; count: number; error?: string }> = [];
        let total = 0;
        for (const city of CITIES) {
          for (const category of cats) {
            for (const query of QUERY_VARIANTS[category]) {
              try {
                const r = await runPlacesImport({ query, city, category });
                total += r.count;
                results.push({ city, category, query, count: r.count });
              } catch (e) {
                results.push({ city, category, query, count: 0, error: e instanceof Error ? e.message : String(e) });
              }
            }
          }
        }
        return Response.json({ total, results });
      },
    },
  },
});
