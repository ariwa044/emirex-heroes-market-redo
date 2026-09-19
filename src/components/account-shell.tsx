import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowDownToLine, ArrowUpFromLine, BarChart3, History, Layers, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/use-admin";
import { AccountLock } from "@/components/account-lock";
import { useQueryClient } from "@tanstack/react-query";

const nav = [
  { to: "/dashboard" as const, label: "Overview", icon: BarChart3 },
  { to: "/deposit" as const, label: "Deposit", icon: ArrowDownToLine },
  { to: "/withdraw" as const, label: "Withdraw", icon: ArrowUpFromLine },
  { to: "/plans" as const, label: "Invest / Plans", icon: Layers },
  { to: "/history" as const, label: "Trading history", icon: History },
  { to: "/profile" as const, label: "Profile", icon: UserRound },
];

export function AccountShell({ title, eyebrow, children }: { title: string; eyebrow: string; children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string>();
  useEffect(() => { void supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id)); }, []);
  const isAdmin = useIsAdmin(userId);
  const items = isAdmin ? [...nav, { to: "/admin" as const, label: "Admin", icon: ShieldCheck }] : nav;
  const [lockReason, setLockReason] = useState<"upgrade" | "hold" | null>(null);
  const [adminBypass, setAdminBypass] = useState(false);
  useEffect(() => {
    if (!userId) { setLockReason(null); return; }
    let active = true;
    const check = async () => {
      const { data } = await supabase.from("profiles").select("upgrade_required,account_on_hold").eq("user_id", userId).maybeSingle();
      if (active) setLockReason(data?.account_on_hold ? "hold" : data?.upgrade_required ? "upgrade" : null);
    };
    void check();
    const id = setInterval(() => void check(), 5000);
    return () => { active = false; clearInterval(id); };
  }, [userId]);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    await navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/60">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5"><span className="grid size-7 rotate-45 place-items-center rounded-md border border-signal bg-signal-soft"><span className="size-2.5 border-r-2 border-t-2 border-signal" /></span><span className="font-head text-lg font-semibold">Heroes<span className="text-signal">Markets</span></span></Link>
          <Button variant="ghost" onClick={signOut}><LogOut /> Sign out</Button>
        </div>
      </header>
      <div className="mx-auto grid max-w-[1440px] md:grid-cols-[230px_1fr]">
        <aside className="border-b border-border p-4 md:min-h-[calc(100vh-4rem)] md:border-b-0 md:border-r md:p-6">
          <nav className="flex gap-2 overflow-x-auto md:flex-col" aria-label="Account navigation">
            {items.map(({ to, label, icon: Icon }) => <Link key={to} to={to} activeProps={{ className: "bg-primary text-primary-foreground" }} inactiveProps={{ className: "text-muted-foreground hover:bg-accent hover:text-foreground" }} className="flex h-10 shrink-0 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors"><Icon className="size-4" />{label}</Link>)}
          </nav>
        </aside>
        <main className="min-w-0 p-4 sm:p-6 lg:p-9">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-signal">{eyebrow}</p>
          <h1 className="mt-2 font-head text-3xl font-semibold">{title}</h1>
          <div className="mt-7">{children}</div>
        </main>
      </div>
      {lockReason && !adminBypass && <AccountLock reason={lockReason} onDismiss={isAdmin ? () => setAdminBypass(true) : undefined} />}
    </div>
  );
}