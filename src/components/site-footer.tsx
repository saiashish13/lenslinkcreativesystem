import { Link } from "@tanstack/react-router";
import { Camera } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 mt-24 bg-card/30">
      <div className="max-w-7xl mx-auto px-6 py-12 grid gap-10 md:grid-cols-4 text-sm">
        <div>
          <Link to="/" className="flex items-center gap-2 font-display text-base">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-[image:var(--gradient-gold)] text-primary-foreground">
              <Camera className="h-4 w-4" />
            </span>
            LensLink<span className="text-primary">.AI</span>
          </Link>
          <p className="mt-4 text-muted-foreground text-xs leading-relaxed">
            Discover real photographers, videographers and editors across India. No fake listings. No AI-generated portfolios.
          </p>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Discover</div>
          <ul className="space-y-2">
            <li><Link to="/marketplace" search={{ q: "", city: "", category: "photographer", budget: "any", minRating: 0, sort: "price_asc" }} className="hover:text-foreground text-muted-foreground">Photographers</Link></li>
            <li><Link to="/marketplace" search={{ q: "", city: "", category: "videographer", budget: "any", minRating: 0, sort: "price_asc" }} className="hover:text-foreground text-muted-foreground">Videographers</Link></li>
            <li><Link to="/marketplace" search={{ q: "", city: "", category: "editor", budget: "any", minRating: 0, sort: "price_asc" }} className="hover:text-foreground text-muted-foreground">Editors</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">For creators</div>
          <ul className="space-y-2">
            <li><Link to="/signup" className="hover:text-foreground text-muted-foreground">List your business</Link></li>
            <li><Link to="/login" className="hover:text-foreground text-muted-foreground">Claim your profile</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Data & compliance</div>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Business data from public sources including Google Maps. Listings refreshed at least every 30 days. Reviews & ratings shown via Google with attribution. Powered by Google Maps Platform.
          </p>
        </div>
      </div>
      <div className="border-t border-border/60">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <div>© {new Date().getFullYear()} LensLink.AI · All trademarks belong to their respective owners.</div>
          <div className="flex items-center gap-4">
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener" className="hover:text-foreground">Google privacy</a>
            <a href="https://policies.google.com/terms" target="_blank" rel="noopener" className="hover:text-foreground">Google ToS</a>
          </div>
        </div>
      </div>
    </footer>
  );
}