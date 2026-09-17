import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine, ArrowUpRight, History, Layers, WalletCards } from "lucide-react";
import { AccountShell } from "@/components/account-shell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { accruedProfit } from "@/lib/investment";

type LiveRow = { amount: number; status: string; started_at: string; ends_at: string | null; plan_id: string };
type PlanRow = { id: string; roi_percent: number; duration_days: number };

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard | HeroesMarkets" }, { name: "description", content: "Your HeroesMarkets account overview." }, { property: "og:title", content: "Dashboard | HeroesMarkets" }, { property: "og:description", content: "Your HeroesMarkets account overview." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = Route.useRouteContext();
  const [tradeCount, setTradeCount] = useState(0);
  const [profit, setProfit] = useState(0);
  const [welcomeName, setWelcomeName] = useState("");
  const [cash, setCash] = useState(0);
  const [invested, setInvested] = useState(0);
  const [live, setLive] = useState<{ rows: LiveRow[]; plans: PlanRow[] }>({ rows: [], plans: [] });
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  useEffect(() => { supabase.from("trading_history").select("profit_loss").eq("user_id", user.id).then(({ data }) => { setTradeCount(data?.length ?? 0); setProfit(data?.reduce((sum, row) => sum + (row.profit_loss ?? 0), 0) ?? 0); }); }, [user.id]);
  useEffect(() => {
    void (async () => {
      const [{ data: tx }, { data: inv }, { data: pl }] = await Promise.all([
        supabase.from("transactions").select("type,amount,status").eq("user_id", user.id),
        supabase.from("investments").select("amount,status,started_at,ends_at,plan_id").eq("user_id", user.id),
        supabase.from("investment_plans").select("id,roi_percent,duration_days"),
      ]);
      const rows = ((inv ?? []) as LiveRow[]);
      const active = rows.filter((r) => r.status === "active").reduce((sum, row) => sum + Number(row.amount), 0);
      const money = (tx ?? []).reduce((sum, row) => {
        if (row.status === "rejected") return sum;
        if (row.type === "deposit") return row.status === "completed" ? sum + Number(row.amount) : sum;
        return sum - Number(row.amount);
      }, 0);
      setInvested(active);
      setCash(money);
      setLive({ rows, plans: ((pl ?? []) as PlanRow[]) });
    })();
  }, [user.id]);
  const livePl = live.rows.reduce((sum, row) => sum + accruedProfit(row, live.plans.find((p) => p.id === row.plan_id), now), 0);
  const balance = cash - invested + livePl;
  const totalPl = profit + livePl;
  useEffect(() => {
    const name = sessionStorage.getItem("heroes-welcome");
    if (!name) return;
    setWelcomeName(name);
    sessionStorage.removeItem("heroes-welcome");
  }, []);
  return <AccountShell eyebrow="Control room" title="Account overview">
    {welcomeName && <section className="mb-3 flex items-center justify-between gap-4 rounded-2xl border border-signal/40 bg-signal-soft p-5"><div><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-signal">Account ready</p><h2 className="mt-1 font-head text-xl font-semibold">Welcome to HeroesMarkets, {welcomeName}</h2><p className="mt-1 text-sm text-muted-foreground">Your trading account has been created successfully.</p></div><span className="hidden size-10 place-items-center rounded-xl bg-primary text-primary-foreground sm:grid">✓</span></section>}
    <div className="mb-3 flex flex-wrap gap-2">
      <Button asChild><Link to="/deposit"><ArrowDownToLine /> Deposit</Link></Button>
      <Button asChild variant="outline"><Link to="/withdraw"><ArrowUpFromLine /> Withdraw</Link></Button>
      <Button asChild variant="outline"><Link to="/plans"><Layers /> Invest</Link></Button>
    </div>
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {[['Account balance', `$${balance.toFixed(2)}`, 'Funds available to trade'], ['Invested', `$${invested.toFixed(2)}`, 'Active investment plans'], ['Net profit / loss', `${profit >= 0 ? '+' : '-'}$${Math.abs(profit).toFixed(2)}`, 'Across recorded trades'], ['Total trades', String(tradeCount), 'Open and closed positions']].map(([label,value,copy]) => <article key={label} className="rounded-2xl border border-border bg-card p-6"><p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p><p className="mt-3 font-head text-3xl font-semibold">{value}</p><p className="mt-2 text-xs text-muted-foreground">{copy}</p></article>)}
    </div>
    <div className="mt-3 grid gap-3 lg:grid-cols-[1.5fr_1fr]">
      <section className="rounded-2xl border border-border bg-card p-6"><div className="flex items-center justify-between"><div><p className="text-[11px] uppercase tracking-[0.18em] text-signal">Portfolio</p><h2 className="mt-2 font-head text-xl font-semibold">Performance</h2></div><WalletCards className="text-signal" /></div><div className="chart-grid mt-6 grid h-56 place-items-center rounded-xl border border-border bg-background/40 text-center"><div><p className="font-head text-lg font-semibold">Your performance starts here</p><p className="mt-2 text-sm text-muted-foreground">Completed trades will appear on this chart.</p></div></div></section>
      <section className="rounded-2xl border border-border bg-card p-6"><History className="text-signal" /><h2 className="mt-5 font-head text-xl font-semibold">Trading history</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Review every recorded position, result, and execution time.</p><Button asChild variant="outline" className="mt-6"><Link to="/history">View history <ArrowUpRight /></Link></Button></section>
    </div>
  </AccountShell>;
}