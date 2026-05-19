import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const InputSchema = z.object({
  brief: z.string().min(3).max(800),
  filters: z.object({
    eventType: z.string().max(80).optional(),
    style: z.string().max(120).optional(),
    budgetInr: z.number().int().min(0).max(10_000_000).optional(),
    location: z.string().max(80).optional(),
    category: z.enum(["photographer", "videographer", "editor"]).optional(),
  }).optional(),
  professionals: z.array(z.object({
    handle: z.string(),
    name: z.string(),
    category: z.string(),
    specialty: z.string(),
    city: z.string(),
    hourly: z.number(),
    rating: z.number(),
    languages: z.array(z.string()),
  })).min(1).max(50),
});

export const recommendCreators = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => InputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Lovable AI not configured");

    // Historical behavior: past bookings + saved creators (best-effort)
    let history = "";
    try {
      const { supabase, userId } = context;
      const [{ data: bookings }, { data: favs }] = await Promise.all([
        supabase
          .from("bookings")
          .select("professional_handle,category,city,budget_inr,status")
          .eq("customer_id", userId)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("favorites")
          .select("professional_handle")
          .eq("customer_id", userId)
          .limit(20),
      ]);
      const bookedHandles = (bookings ?? []).map((b) => `@${b.professional_handle}(${b.category}/${b.city ?? "-"})`).join(", ");
      const favHandles = (favs ?? []).map((f) => `@${f.professional_handle}`).join(", ");
      const avgBudget = (bookings ?? []).map((b) => b.budget_inr ?? 0).filter((n) => n > 0);
      const avg = avgBudget.length ? Math.round(avgBudget.reduce((a, b) => a + b, 0) / avgBudget.length) : 0;
      history = [
        bookedHandles && `Past bookings: ${bookedHandles}.`,
        favHandles && `Saved: ${favHandles}.`,
        avg && `Typical budget: ₹${avg}.`,
      ].filter(Boolean).join(" ");
    } catch {
      history = "";
    }

    const f = data.filters ?? {};
    const filterLines = [
      f.eventType && `Event type: ${f.eventType}`,
      f.style && `Style preference: ${f.style}`,
      f.budgetInr && `Budget: ₹${f.budgetInr}`,
      f.location && `Location: ${f.location}`,
      f.category && `Category: ${f.category}`,
    ].filter(Boolean).join("\n");

    const sys = `You are a creative producer matching Indian clients with photographers, videographers and editors.
Weight signals in this order: explicit filters > brief > historical behavior > rating.
Penalize creators whose hourly far exceeds the stated budget, and prefer creators in or near the requested city.
Reply with strict JSON: {"picks":[{"handle":"...","reason":"<one short sentence referencing matching filters/history, INR-aware>"}]}.
Pick the top 3 from the provided list. Use only handles from the list.`;
    const userMsg = `Brief: ${data.brief}
${filterLines ? `\nFilters:\n${filterLines}\n` : ""}${history ? `\nHistory: ${history}\n` : ""}
Creators:
${data.professionals.map((p) => `- @${p.handle} | ${p.name} | ${p.category} · ${p.specialty} | ${p.city} | ₹${p.hourly}/hr | ${p.rating}★ | ${p.languages.join(", ")}`).join("\n")}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: userMsg },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (res.status === 429) throw new Error("Rate limit reached. Please try again in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted. Add credits in Lovable Cloud settings.");
    if (!res.ok) throw new Error(`AI error: ${res.status}`);

    const json = await res.json();
    const content = json.choices?.[0]?.message?.content ?? "{}";
    let parsed: { picks?: { handle: string; reason: string }[] } = {};
    try { parsed = JSON.parse(content); } catch { parsed = {}; }
    const picks = (parsed.picks ?? []).filter((p) => data.professionals.some((x) => x.handle === p.handle)).slice(0, 3);
    return { picks };
  });