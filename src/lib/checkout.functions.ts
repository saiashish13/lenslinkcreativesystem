import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import Stripe from "stripe";
import { getRequestHeader } from "@tanstack/react-start/server";

const PLANS = {
  "customer-pro": {
    name: "LensLink Customer Pro",
    monthly: 99900, // ₹999
    annual: 999000, // ₹9,990
  },
  "creator-pro": {
    name: "LensLink Creator Pro",
    monthly: 49900, // ₹499
    annual: 499000, // ₹4,990
  },
} as const;

const Input = z.object({
  plan: z.enum(["customer-pro", "creator-pro"]),
  billingPeriod: z.enum(["monthly", "annual"]),
});

export const createCheckoutSession = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data }) => {
    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) throw new Error("STRIPE_SECRET_KEY is not configured");

    const stripe = new Stripe(secret);
    const plan = PLANS[data.plan];
    const amount = data.billingPeriod === "annual" ? plan.annual : plan.monthly;
    const interval = data.billingPeriod === "annual" ? "year" : "month";

    const host = getRequestHeader("x-forwarded-host") ?? getRequestHeader("host");
    const proto = getRequestHeader("x-forwarded-proto") ?? "https";
    const origin = host ? `${proto}://${host}` : "http://localhost:8080";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: { name: `${plan.name} (${data.billingPeriod})` },
            unit_amount: amount,
            recurring: { interval },
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?canceled=1`,
      allow_promotion_codes: true,
      metadata: { plan: data.plan, billingPeriod: data.billingPeriod },
    });

    return { url: session.url };
  });