import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({ query: z.string().min(2).max(300) });

const FiltersSchema = z.object({
  q: z.string().max(120).optional().default(""),
  city: z.string().max(80).optional().default(""),
  category: z.enum(["all", "photographer", "videographer", "editor"]).optional().default("all"),
  availability: z.enum(["any", "today", "this-week", "this-month"]).optional().default("any"),
  minRating: z.number().min(0).max(5).optional().default(0),
  maxBudget: z.number().min(2000).max(50000).optional().default(50000),
});

export type AISearchFilters = z.infer<typeof FiltersSchema>;

export const parseSearchQuery = createServerFn({ method: "POST" })
  .inputValidator((i) => InputSchema.parse(i))
  .handler(async ({ data }): Promise<AISearchFilters> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Lovable AI not configured");

    const sys = `Convert a natural-language creator-search query into marketplace filters for an Indian photography platform.
Reply with strict JSON matching: {"q":string,"city":string,"category":"all"|"photographer"|"videographer"|"editor","availability":"any"|"today"|"this-week"|"this-month","minRating":number,"maxBudget":number}.
- "q" should be short free-text keywords (style/specialty), not the full sentence.
- "city" is a single Indian city/town if mentioned, else "".
- Convert budgets: "20k"=20000, "1L"=100000 (cap at 50000 since this is per-hour). If they say a total budget like "₹2L for a wedding", estimate hourly ~ total/12 capped at 50000.
- Use "today"/"this-week"/"this-month" only if explicitly time-bound.
- minRating defaults to 0; bump to 4.8 if user says "top" or "premium".
- Never invent filters not implied by the query.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: data.query },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (res.status === 429) throw new Error("Rate limit reached. Try again shortly.");
    if (res.status === 402) throw new Error("AI credits exhausted.");
    if (!res.ok) throw new Error(`AI error: ${res.status}`);
    const json = await res.json();
    const content = json.choices?.[0]?.message?.content ?? "{}";
    let parsed: unknown = {};
    try { parsed = JSON.parse(content); } catch { parsed = {}; }
    return FiltersSchema.parse(parsed);
  });