import { createFileRoute } from "@tanstack/react-router";
import { DashShell } from "@/components/dash-shell";

export const Route = createFileRoute("/_authenticated/editor")({
  head: () => ({ meta: [{ title: "Editor dashboard — LensLink AI" }] }),
  component: () => (
    <DashShell title="Editor workspace" subtitle="Assigned projects, file versions and deliveries.">
      <div className="grid md:grid-cols-3 gap-4">
        {["Assigned projects", "File versions", "Revisions", "Time tracking", "Deliveries", "Earnings"].map((t) => (
          <div key={t} className="rounded-xl border border-border bg-card/60 p-6">
            <div className="font-medium">{t}</div>
            <div className="text-sm text-muted-foreground mt-2">Coming in the next phase.</div>
          </div>
        ))}
      </div>
    </DashShell>
  ),
});
