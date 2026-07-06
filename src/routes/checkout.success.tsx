import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/checkout/success")({
  component: SuccessPage,
  head: () => ({
    meta: [{ title: "Payment successful — LensLink.AI" }],
  }),
});

function SuccessPage() {
  return (
    <main className="min-h-screen">
      <SiteNav />
      <section className="pt-40 pb-32">
        <div className="max-w-xl mx-auto px-6 text-center">
          <CheckCircle2 className="mx-auto h-14 w-14 text-primary" />
          <h1 className="mt-6 font-display text-4xl tracking-tight">Payment successful</h1>
          <p className="mt-3 text-muted-foreground">
            Thanks for subscribing. Your plan is now active — a receipt is on the way to your inbox.
          </p>
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
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}