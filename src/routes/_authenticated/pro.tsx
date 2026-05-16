import { createFileRoute } from "@tanstack/react-router";
import { DashShell } from "@/components/dash-shell";

export const Route = createFileRoute("/_authenticated/pro")({
  head: () => ({ meta: [{ title: "Creator dashboard — LensLink AI" }] }),
  component: () => (
    <DashShell title="Creator studio" subtitle="Manage bookings, availability and your portfolio.">
      <div className="grid md:grid-cols-3 gap-4">
        {["Incoming bookings", "Availability", "Portfolio", "Pricing packages", "Revenue", "AI tools"].map((t) => (
          <div key={t} className="rounded-xl border border-border bg-card/60 p-6">
            <div className="font-medium">{t}</div>
            <div className="text-sm text-muted-foreground mt-2">Coming in the next phase.</div>
          </div>
        ))}
      </div>
    </DashShell>
  ),
});
