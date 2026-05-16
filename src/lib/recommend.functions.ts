import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  brief: z.string().min(3).max(800),
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
  .inputValidator((input) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Lovable AI not configured");

    const sys = `You are a creative producer matching Indian clients with photographers, videographers and editors. Reply with strict JSON: {"picks":[{"handle":"...","reason":"<one short sentence, INR-aware>"}]}. Pick the top 3 from the list that best match the brief. Use only handles from the provided list.`;
    const userMsg = `Brief: ${data.brief}\n\nCreators:\n${data.professionals.map((p) => `- @${p.handle} | ${p.name} | ${p.category} · ${p.specialty} | ${p.city} | ₹${p.hourly}/hr | ${p.rating}★ | ${p.languages.join(", ")}`).join("\n")}`;

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