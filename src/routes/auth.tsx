import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const signupSchema = z.object({
  email: z.string().trim().email("Enter a valid email address.").max(255),
  username: z.string().trim().min(3, "Username must be at least 3 characters.").max(30).regex(/^[A-Za-z0-9_.]+$/, "Use only letters, numbers, underscores, or periods."),
  fullName: z.string().trim().min(2, "Enter your full name.").max(100),
  password: z.string().min(8, "Password must be at least 8 characters.").max(72),
});

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Log in | HeroesMarkets" }, { name: "description", content: "Access your HeroesMarkets trading account." }, { property: "og:title", content: "Log in | HeroesMarkets" }, { property: "og:description", content: "Access your HeroesMarkets trading account." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function ensureProfile(user: { id: string; user_metadata?: Record<string, unknown> }) {
    const metadata = user.user_metadata ?? {};
    const metadataUsername = typeof metadata["username"] === "string" ? metadata["username"] : null;
    const metadataFullName = typeof metadata["full_name"] === "string" ? metadata["full_name"] : "";
    if (!metadataUsername) return null;
    const { error } = await supabase.from("profiles").upsert({
      user_id: user.id,
      username: metadataUsername,
      display_name: metadataFullName,
    }, { onConflict: "user_id", ignoreDuplicates: true });
    return error;
  }

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const error = await ensureProfile(data.user);
      if (error) { setMessage(error.code === "23505" ? "That username is already taken." : error.message); return; }
      navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    if (mode === "login") {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) return setMessage(error.message);
      if (data.user) {
        const profileError = await ensureProfile(data.user);
        if (profileError) return setMessage(profileError.code === "23505" ? "That username is already taken." : profileError.message);
      }
      await navigate({ to: "/dashboard", replace: true });
      return;
    }
    const validation = signupSchema.safeParse({ email, username, fullName, password });
    if (!validation.success) { setBusy(false); setMessage(validation.error.issues[0]?.message ?? "Check your details."); return; }
    const values = validation.data;
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth`,
        data: { username: values.username, full_name: values.fullName },
      },
    });
    setBusy(false);
    if (error) return setMessage(error.message);
    if (data.session && data.user) {
      const profileError = await ensureProfile(data.user);
      if (profileError) return setMessage(profileError.code === "23505" ? "That username is already taken." : profileError.message);
    }
    if (!data.session) {
      setMessage("Your account was created. Log in to continue.");
      setMode("login");
      return;
    }
    sessionStorage.setItem("heroes-welcome", values.fullName);
    await navigate({ to: "/dashboard", replace: true });
  }

  async function googleSignIn() {
    setBusy(true); setMessage("");
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: `${window.location.origin}/auth` });
    setBusy(false);
    if (result.error) setMessage(result.error.message);
    else if (!result.redirected) await navigate({ to: "/dashboard", replace: true });
  }

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 py-10 text-foreground">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Back to markets</Link>
        <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
          <div className="flex items-center gap-2.5"><span className="grid size-8 rotate-45 place-items-center rounded-md border border-signal bg-signal-soft"><span className="size-3 border-r-2 border-t-2 border-signal" /></span><span className="font-head text-xl font-semibold">Heroes<span className="text-signal">Markets</span></span></div>
          <h1 className="mt-8 font-head text-3xl font-semibold">{mode === "login" ? "Welcome back" : "Open your account"}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{mode === "login" ? "Enter the trading control room." : "Create your secure HeroesMarkets account."}</p>
          <Button variant="outline" className="mt-7 h-11 w-full" onClick={googleSignIn} disabled={busy}><span className="font-semibold">G</span> Continue with Google</Button>
          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or use email<span className="h-px flex-1 bg-border" /></div>
          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && <>
              <div className="space-y-2"><Label htmlFor="full-name">Full name</Label><Input id="full-name" autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} required minLength={2} maxLength={100} placeholder="Alex Morgan" className="h-11" /></div>
              <div className="space-y-2"><Label htmlFor="username">Username</Label><Input id="username" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} required minLength={3} maxLength={30} pattern="[A-Za-z0-9_.]+" placeholder="alex.morgan" className="h-11" /></div>
            </>}
            <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" autoComplete="email" maxLength={255} value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="trader@example.com" className="h-11" /></div>
            <div className="space-y-2"><Label htmlFor="password">Password</Label><div className="relative"><Input id="password" type={showPassword ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required className="h-11 pr-11" /><Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff /> : <Eye />}</Button></div></div>
            {message && <p className="rounded-lg border border-border bg-background/40 p-3 text-sm text-muted-foreground" role="status">{message}</p>}
            <Button className="h-11 w-full" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}</Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">{mode === "login" ? "New to HeroesMarkets?" : "Already have an account?"} <button className="font-semibold text-signal" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setMessage(""); }}>{mode === "login" ? "Create account" : "Log in"}</button></p>
        </section>
      </div>
    </main>
  );
}