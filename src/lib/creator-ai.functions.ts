import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const CaptionInput = z.object({
  context: z.string().min(3).max(500),
  tone: z.enum(["editorial", "fun", "luxury", "minimal"]).default("editorial"),
});

async function callLovableAI(messages: { role: string; content: string }[], jsonMode = true) {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("Lovable AI not configured");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages,
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (res.status === 429) throw new Error("Rate limit reached. Try again shortly.");
  if (res.status === 402) throw new Error("AI credits exhausted.");
  if (!res.ok) throw new Error(`AI error: ${res.status}`);
  const json = await res.json();
  return json.choices?.[0]?.message?.content ?? "{}";
}

export const generateCaption = createServerFn({ method: "POST" })
  .inputValidator((input) => CaptionInput.parse(input))
  .handler(async ({ data }) => {
    const sys = `You are a social media copywriter for Indian photographers. Return strict JSON: {"caption":"...","hashtags":["#tag1",...]}. Caption max 220 chars, ${data.tone} tone. 6-10 relevant hashtags mixing English and India-specific (e.g. #IndianWedding, #MumbaiPhotographer).`;
    const content = await callLovableAI([
      { role: "system", content: sys },
      { role: "user", content: data.context },
    ]);
    try {
      const parsed = JSON.parse(content) as { caption?: string; hashtags?: string[] };
      return { caption: parsed.caption ?? "", hashtags: parsed.hashtags ?? [] };
    } catch {
      return { caption: "", hashtags: [] };
    }
  });

const PricingInput = z.object({
  category: z.string().min(2).max(40),
  city: z.string().min(2).max(60),
  experience_years: z.number().min(0).max(50),
  specialty: z.string().min(2).max(120),
});

export const suggestPricing = createServerFn({ method: "POST" })
  .inputValidator((input) => PricingInput.parse(input))
  .handler(async ({ data }) => {
    const sys = `You are an Indian creative-industry pricing analyst. Return strict JSON: {"hourly_inr": number, "half_day_inr": number, "full_day_inr": number, "rationale": "<one short sentence>"}. Numbers must be realistic Indian market rates in INR.`;
    const user = `Category: ${data.category}\nCity: ${data.city}\nExperience: ${data.experience_years} years\nSpecialty: ${data.specialty}`;
    const content = await callLovableAI([
      { role: "system", content: sys },
      { role: "user", content: user },
    ]);
    try {
      const p = JSON.parse(content);
      return {
        hourly_inr: Number(p.hourly_inr) || 0,
        half_day_inr: Number(p.half_day_inr) || 0,
        full_day_inr: Number(p.full_day_inr) || 0,
        rationale: String(p.rationale ?? ""),
      };
    } catch {
      return { hourly_inr: 0, half_day_inr: 0, full_day_inr: 0, rationale: "" };
    }
  });