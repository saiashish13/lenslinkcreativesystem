import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Camera } from "lucide-react";

export function SiteNav() {
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
          <Link to="/" hash="features" className="hover:text-foreground transition">Platform</Link>
          <Link to="/" hash="pricing" className="hover:text-foreground transition">Pricing</Link>
          <Link to="/" hash="faq" className="hover:text-foreground transition">FAQ</Link>
        </nav>
        <div className="flex items-center gap-2">
          <a href="#" className="hidden sm:inline text-sm text-muted-foreground hover:text-foreground px-3 py-2">Sign in</a>
          <Link to="/marketplace" className="inline-flex items-center gap-1 rounded-md bg-[image:var(--gradient-gold)] text-primary-foreground px-4 py-2 text-sm font-medium shadow-[var(--shadow-gold)] hover:opacity-90 transition">
            Browse <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
