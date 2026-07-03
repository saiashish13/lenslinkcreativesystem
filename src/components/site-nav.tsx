import { Link, useRouter } from "@tanstack/react-router";
import { ArrowUpRight, Camera, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { NotificationBell } from "@/components/notification-bell";

export function SiteNav() {
  const { user, roles, signOut } = useAuth();
  const router = useRouter();

  const dashHref = roles.includes("admin")
    ? "/admin"
    : roles.includes("photographer")
    ? "/pro"
    : roles.includes("editor")
    ? "/editor"
    : "/app";

  const roleLinks: { to: "/pro" | "/editor" | "/admin"; label: string }[] = [];
  if (roles.includes("photographer")) roleLinks.push({ to: "/pro", label: "Creator Studio" });
  if (roles.includes("editor")) roleLinks.push({ to: "/editor", label: "Editor Studio" });
  if (roles.includes("admin")) roleLinks.push({ to: "/admin", label: "Admin" });

  return (
    <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-background/60 border-b border-border/50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-display text-lg tracking-tight">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-[image:var(--gradient-gold)] text-primary-foreground">
            <Camera className="h-4 w-4" />
          </span>
          LensLink<span className="text-primary">.AI</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <Link to="/marketplace" activeProps={{ className: "text-foreground" }} className="hover:text-foreground transition">Discover</Link>
          {roleLinks.map((l) => (
            <Link key={l.to} to={l.to} activeProps={{ className: "text-foreground" }} className="hover:text-foreground transition">
              {l.label}
            </Link>
          ))}
          <Link to="/" hash="features" className="hover:text-foreground transition">Platform</Link>
          <Link to="/" hash="pricing" className="hover:text-foreground transition">Pricing</Link>
          <Link to="/" hash="faq" className="hover:text-foreground transition">FAQ</Link>
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <NotificationBell />
              <Link
                to={dashHref}
                className="hidden sm:inline-flex items-center rounded-md border border-border px-3 py-2 text-sm text-foreground hover:bg-card transition"
              >
                Dashboard
              </Link>
              <button
                onClick={async () => { await signOut(); router.navigate({ to: "/" }); }}
                className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 text-sm hover:bg-card transition"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hidden sm:inline text-sm text-muted-foreground hover:text-foreground px-3 py-2">Sign in</Link>
              <Link to="/signup" className="inline-flex items-center gap-1 rounded-md bg-[image:var(--gradient-gold)] text-primary-foreground px-4 py-2 text-sm font-medium shadow-[var(--shadow-gold)] hover:opacity-90 transition">
                Get started <ArrowUpRight className="h-4 w-4" />
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
