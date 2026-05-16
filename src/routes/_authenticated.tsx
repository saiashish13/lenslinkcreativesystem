import { createFileRoute, Outlet, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated")({
  component: AuthGate,
});

function AuthGate() {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !user) router.navigate({ to: "/login" });
  }, [loading, user, router]);
  if (loading || !user) {
    return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading…</div>;
  }
  return <Outlet />;
}
