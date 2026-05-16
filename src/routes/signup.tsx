import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Create account — LensLink AI" }] }),
  component: SignupPage,
});

function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: window.location.origin + "/onboarding",
        data: { full_name: fullName },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Account created");
    router.navigate({ to: "/onboarding" });
  };

  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/onboarding" });
    if (r.error) toast.error(r.error.message || "Google sign-in failed");
  };

  return (
    <div className="min-h-screen grid place-items-center bg-background px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-border bg-card/60 backdrop-blur-xl p-8">
        <Link to="/" className="flex items-center gap-2 font-display text-lg mb-6">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-[image:var(--gradient-gold)] text-primary-foreground">
            <Camera className="h-4 w-4" />
          </span>
          LensLink<span className="text-primary">.AI</span>
        </Link>
        <h1 className="font-display text-3xl">Create your account</h1>
        <p className="text-sm text-muted-foreground mt-1">Join India's AI-powered creative marketplace</p>

        <button onClick={google} className="mt-6 w-full rounded-md border border-border px-4 py-2.5 text-sm hover:bg-card transition">
          Continue with Google
        </button>
        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" />or<div className="h-px flex-1 bg-border" />
        </div>
        <form onSubmit={onSubmit} className="space-y-3">
          <input required placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm" />
          <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm" />
          <input type="password" required minLength={8} placeholder="Password (min 8 chars)" value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm" />
          <button disabled={loading} className="w-full rounded-md bg-[image:var(--gradient-gold)] text-primary-foreground px-4 py-2.5 text-sm font-medium shadow-[var(--shadow-gold)] disabled:opacity-50">
            {loading ? "Creating…" : "Create account"}
          </button>
        </form>
        <p className="text-sm text-muted-foreground mt-5 text-center">
          Already a member? <Link to="/login" className="text-primary">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
