import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import Stripe from "stripe";
import { getRequestHeader } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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

const VerifyInput = z.object({
  sessionId: z.string().min(1),
});

// Creates a Stripe Checkout session. Only a signed-in user can call this, and
// the session is bound to their user id (client_reference_id + metadata) so
// later billing actions can be proven to belong to the same customer.
export const createCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data, context }) => {
    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) throw new Error("STRIPE_SECRET_KEY is not configured");

    const stripe = new Stripe(secret);
    const plan = PLANS[data.plan];
    const amount = data.billingPeriod === "annual" ? plan.annual : plan.monthly;
    const interval = data.billingPeriod === "annual" ? "year" : "month";
    const email = (context.claims as { email?: string }).email;

    const host = getRequestHeader("x-forwarded-host") ?? getRequestHeader("host");
    const proto = getRequestHeader("x-forwarded-proto") ?? "https";
    const origin = host ? `${proto}://${host}` : "http://localhost:8080";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: email || undefined,
      client_reference_id: context.userId,
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
      metadata: { plan: data.plan, billingPeriod: data.billingPeriod, user_id: context.userId },
    });

    return { url: session.url };
  });

// Verifies a completed checkout session. Only the user the session was created
// for receives its details — anyone else gets a neutral "not owned" result.
export const verifyCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => VerifyInput.parse(data))
  .handler(async ({ data, context }) => {
    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) throw new Error("STRIPE_SECRET_KEY is not configured");

    const stripe = new Stripe(secret);
    const session = await stripe.checkout.sessions.retrieve(data.sessionId);

    const owned =
      session.client_reference_id === context.userId ||
      session.metadata?.user_id === context.userId;
    if (!owned) return { owned: false as const };

    return {
      owned: true as const,
      status: session.status,
      paymentStatus: session.payment_status,
      plan: session.metadata?.plan ?? null,
      billingPeriod: session.metadata?.billingPeriod ?? null,
      amountTotal: session.amount_total ?? null,
      currency: session.currency ?? "inr",
      customerEmail: session.customer_details?.email ?? null,
    };
  });
