import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = new URL(request.url).origin;
        const staticUrls = ["/", "/marketplace", "/signup", "/login"];

        const { data: listings } = await supabaseAdmin
          .from("creator_listings")
          .select("slug, updated_at, city, categories")
          .eq("is_published", true)
          .limit(5000);

        const seen = new Set<string>();
        const discoverUrls: string[] = [];
        for (const l of listings ?? []) {
          const city = (l.city ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
          if (!city) continue;
          for (const cat of l.categories ?? []) {
            const key = `${cat}/${city}`;
            if (seen.has(key)) continue;
            seen.add(key);
            discoverUrls.push(`/discover/${cat}/${city}`);
          }
        }

        const urls = [
          ...staticUrls.map((u) => ({ loc: `${origin}${u}`, lastmod: new Date().toISOString() })),
          ...(listings ?? []).map((l) => ({ loc: `${origin}/creators/${l.slug}`, lastmod: l.updated_at })),
          ...discoverUrls.map((u) => ({ loc: `${origin}${u}`, lastmod: new Date().toISOString() })),
        ];

        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
          .map((u) => `  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod></url>`)
          .join("\n")}\n</urlset>`;

        return new Response(xml, {
          status: 200,
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});