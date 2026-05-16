import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { DashShell } from "@/components/dash-shell";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — LensLink AI" }] }),
  component: AdminDash,
});

function AdminDash() {
  const { roles, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !roles.includes("admin")) router.navigate({ to: "/app" });
  }, [loading, roles, router]);

  return (
    <DashShell title="Admin console" subtitle="Marketplace, users, payments, moderation.">
      <div className="grid md:grid-cols-3 gap-4">
        {["Users", "Verifications", "Revenue & commission", "Disputes", "AI moderation", "CMS & banners", "Tax & invoices", "Global settings"].map((t) => (
          <div key={t} className="rounded-xl border border-border bg-card/60 p-6">
            <div className="font-medium">{t}</div>
            <div className="text-sm text-muted-foreground mt-2">Coming in the next phase.</div>
          </div>
        ))}
      </div>
    </DashShell>
  );
}
