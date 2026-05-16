import { ReactNode } from "react";
import { SiteNav } from "@/components/site-nav";

export function DashShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="max-w-7xl mx-auto px-6 pt-28 pb-16">
        <h1 className="font-display text-4xl">{title}</h1>
        {subtitle && <p className="text-muted-foreground mt-2">{subtitle}</p>}
        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}
