import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock, ShieldAlert } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { verifyCheckoutSession } from "@/lib/checkout.functions";
import { useAuth } from "@/hooks/use-auth";
import { formatINR } from "@/lib/format";

export const Route = createFileRoute("/checkout/success")({
  validateSearch: (search: Record<string, unknown>) => ({
    session_id: typeof search.session_id === "string" ? search.session_id : undefined,
  }),
  component: SuccessPage,
  head: () => ({
    meta: [{ title: "Payment successful — LensLink.AI" }],
  }),
});

function SuccessPage() {
  const { session_id } = Route.useSearch();
  const { session, loading: authLoading } = useAuth();
  const verify = useServerFn(verifyCheckoutSession);

  const { data, isLoading, isError } = useQuery({
    enabled: !!session && !!session_id,
    queryKey: ["checkout-verify", session_id, session?.user?.id],
    queryFn: () => verify({ data: { sessionId: session_id! } }),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const verifying = authLoading || (!!session && !!session_id && (isLoading || (!data && !isError)));
  const paid = data?.owned && (data.paymentStatus === "paid" || data.status === "complete");
  const pending = data?.owned && !paid;

  return (
    <main className="min-h-screen">
      <SiteNav />
      <section className="pt-40 pb-32">
        <div className="max-w-xl mx-auto px-6 text-center">
          {verifying ? (
            <>
              <Clock className="mx-auto h-14 w-14 text-muted-foreground" />
              <h1 className="mt-6 font-display text-4xl tracking-tight">Checking your payment…</h1>
              <p className="mt-3 text-muted-foreground">Verifying your subscription with our payment provider.</p>
            </>
          ) : !session || !session_id ? (
            <>
              <ShieldAlert className="mx-auto h-14 w-14 text-muted-foreground" />
              <h1 className="mt-6 font-display text-3xl tracking-tight">Sign in to view your receipt</h1>
              <p className="mt-3 text-muted-foreground">
                For your security, payment details are only shown to the signed-in account that made the purchase.
              </p>
              <div className="mt-8 flex justify-center gap-3">
                <Link
                  to="/login"
                  className="inline-flex items-center rounded-md bg-[image:var(--gradient-gold)] px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-[var(--shadow-gold)] hover:opacity-90"
                >
                  Sign in
                </Link>
                <Link
                  to="/pricing"
                  className="inline-flex items-center rounded-md border border-border px-5 py-2.5 text-sm hover:bg-card"
                >
                  Back to pricing
                </Link>
              </div>
            </>
          ) : data?.owned === false ? (
            <>
              <ShieldAlert className="mx-auto h-14 w-14 text-muted-foreground" />
              <h1 className="mt-6 font-display text-3xl tracking-tight">We couldn't match this payment to your account</h1>
              <p className="mt-3 text-muted-foreground">
                If you just paid, make sure you're signed in with the same account you used at checkout.
              </p>
              <div className="mt-8 flex justify-center gap-3">
                <Link
                  to="/pricing"
                  className="inline-flex items-center rounded-md border border-border px-5 py-2.5 text-sm hover:bg-card"
                >
                  Back to pricing
                </Link>
              </div>
            </>
          ) : paid ? (
            <>
              <CheckCircle2 className="mx-auto h-14 w-14 text-primary" />
              <h1 className="mt-6 font-display text-4xl tracking-tight">Payment successful</h1>
              <p className="mt-3 text-muted-foreground">
                Thanks for subscribing. Your plan is now active — a receipt is on the way to your inbox.
              </p>
              <div className="mt-6 rounded-xl border border-border bg-card/60 p-4 text-sm text-left space-y-1.5">
                {data.plan && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plan</span>
                    <span className="font-medium capitalize">{data.plan.replace(/-/g, " ")}</span>
                  </div>
                )}
                {data.billingPeriod && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Billing</span>
                    <span className="font-medium capitalize">{data.billingPeriod}</span>
                  </div>
                )}
                {data.amountTotal != null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-medium">{formatINR(data.amountTotal / 100)}</span>
                  </div>
                )}
                {data.customerEmail && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Receipt sent to</span>
                    <span className="font-medium">{data.customerEmail}</span>
                  </div>
                )}
              </div>
              <div className="mt-8 flex justify-center gap-3">
                <Link
                  to="/app"
                  className="inline-flex items-center rounded-md bg-[image:var(--gradient-gold)] px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-[var(--shadow-gold)] hover:opacity-90"
                >
                  Go to dashboard
                </Link>
                <Link
                  to="/pricing"
                  className="inline-flex items-center rounded-md border border-border px-5 py-2.5 text-sm hover:bg-card"
                >
                  Back to pricing
                </Link>
              </div>
            </>
          ) : (
            <>
              <Clock className="mx-auto h-14 w-14 text-primary" />
              <h1 className="mt-6 font-display text-3xl tracking-tight">Payment started — not confirmed yet</h1>
              <p className="mt-3 text-muted-foreground">
                Your checkout session is open but we haven't received confirmation of payment yet. Refresh this page once
                your payment completes.
              </p>
              <div className="mt-8 flex justify-center gap-3">
                <Link
                  to="/pricing"
                  className="inline-flex items-center rounded-md border border-border px-5 py-2.5 text-sm hover:bg-card"
                >
                  Back to pricing
                </Link>
              </div>
            </>
          )}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
