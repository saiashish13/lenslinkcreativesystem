import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarCheck, Heart, MessagesSquare, Sparkles } from "lucide-react";
import { DashShell } from "@/components/dash-shell";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({ meta: [{ title: "Dashboard — LensLink AI" }] }),
  component: CustomerDash,
});

function CustomerDash() {
  const { user } = useAuth();
  const cards = [
    { Icon: CalendarCheck, label: "Bookings", value: "0", href: "/marketplace" },
    { Icon: Heart, label: "Favorites", value: "0", href: "/marketplace" },
    { Icon: MessagesSquare, label: "Messages", value: "0", href: "/marketplace" },
    { Icon: Sparkles, label: "AI matches", value: "—", href: "/marketplace" },
  ];
  return (
    <DashShell title={`Hi, ${user?.user_metadata?.full_name ?? "there"}`} subtitle="Your creative projects, all in one place.">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Link key={c.label} to={c.href} className="rounded-xl border border-border bg-card/60 p-5 hover:border-primary/60 transition">
            <c.Icon className="h-5 w-5 text-primary" />
            <div className="text-2xl font-display mt-3">{c.value}</div>
            <div className="text-sm text-muted-foreground">{c.label}</div>
          </Link>
        ))}
      </div>
      <div className="mt-10 rounded-xl border border-border bg-card/40 p-8 text-center">
        <h2 className="font-display text-2xl">Ready to hire?</h2>
        <p className="text-muted-foreground mt-1">Browse 12k+ verified Indian creators across photography, video and editing.</p>
        <Link to="/marketplace" className="inline-flex mt-4 items-center gap-2 rounded-md bg-[image:var(--gradient-gold)] text-primary-foreground px-5 py-2.5 text-sm font-medium shadow-[var(--shadow-gold)]">
          Browse marketplace
        </Link>
      </div>
    </DashShell>
  );
}
