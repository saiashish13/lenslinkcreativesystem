import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Camera, Scissors, ShoppingBag } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { chooseOwnRole } from "@/lib/roles.functions";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Choose your role — LensLink AI" }] }),
  component: Onboarding,
});

const ROLES = [
  {
    key: "customer",
    title: "I'm a Customer",
    desc: "Hire photographers, videographers and editors",
    Icon: ShoppingBag,
    href: "/app",
  },
  {
    key: "photographer",
    title: "I'm a Creator",
    desc: "Photographer or videographer offering services",
    Icon: Camera,
    href: "/pro",
  },
  {
    key: "editor",
    title: "I'm an Editor",
    desc: "Post-production: photo and video editing",
    Icon: Scissors,
    href: "/editor",
  },
] as const;

function Onboarding() {
  const { user, refreshRoles } = useAuth();
  const router = useRouter();
  const saveRole = useServerFn(chooseOwnRole);
  const [saving, setSaving] = useState<string | null>(null);

  const choose = async (role: (typeof ROLES)[number]) => {
    if (!user) return;
    setSaving(role.key);
    try {
      await saveRole({ data: { role: role.key } });
      await refreshRoles();
      toast.success("Role saved");
      router.navigate({ to: role.href });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save role");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-display text-4xl text-center">Welcome — how will you use LensLink?</h1>
        <p className="text-muted-foreground text-center mt-2">
          You can change this later from your profile.
        </p>
        <div className="grid sm:grid-cols-3 gap-4 mt-10">
          {ROLES.map((r) => (
            <button
              key={r.key}
              disabled={saving !== null}
              onClick={() => choose(r)}
              className="text-left rounded-xl border border-border bg-card/60 p-6 hover:border-primary/60 transition disabled:opacity-50"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-[image:var(--gradient-gold)] text-primary-foreground mb-4">
                <r.Icon className="h-5 w-5" />
              </span>
              <div className="font-medium">{r.title}</div>
              <div className="text-sm text-muted-foreground mt-1">{r.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
