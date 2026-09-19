import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine, Bitcoin, CircleCheck, Gift, History, Layers, Rocket, TrendingUp, WalletCards } from "lucide-react";
import { AccountShell } from "@/components/account-shell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { accruedProfit } from "@/lib/investment";
import { useBtcPrice } from "@/lib/crypto-price";

type LiveRow = { amount: number; status: string; started_at: string; ends_at: string | null; plan_id: string; profit_override: number | null; entry_btc_price: number | null };
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
  const [deposits, setDeposits] = useState(0);
  const [withdrawals, setWithdrawals] = useState(0);
  const [displayName, setDisplayName] = useState("Trader");
  const [live, setLive] = useState<{ rows: LiveRow[]; plans: PlanRow[] }>({ rows: [], plans: [] });
  const [now, setNow] = useState(() => Date.now());
  const btcPrice = useBtcPrice();
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  useEffect(() => { supabase.from("trading_history").select("profit_loss").eq("user_id", user.id).then(({ data }) => { setTradeCount(data?.length ?? 0); setProfit(data?.reduce((sum, row) => sum + (row.profit_loss ?? 0), 0) ?? 0); }); }, [user.id]);
  useEffect(() => {
    void (async () => {
      const [{ data: tx }, { data: inv }, { data: pl }, { data: profile }] = await Promise.all([
        supabase.from("transactions").select("type,amount,status").eq("user_id", user.id),
        supabase.from("investments").select("amount,status,started_at,ends_at,plan_id,profit_override,entry_btc_price").eq("user_id", user.id),
        supabase.from("investment_plans").select("id,roi_percent,duration_days"),
        supabase.from("profiles").select("display_name,username").eq("user_id", user.id).maybeSingle(),
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
      setDeposits((tx ?? []).filter((row) => row.type === "deposit" && row.status === "completed").reduce((sum, row) => sum + Number(row.amount), 0));
      setWithdrawals((tx ?? []).filter((row) => row.type === "withdrawal" && row.status !== "rejected").reduce((sum, row) => sum + Number(row.amount), 0));
      setDisplayName(profile?.display_name || profile?.username || user.email?.split("@")[0] || "Trader");
      setLive({ rows, plans: ((pl ?? []) as PlanRow[]) });
    })();
  }, [user.id]);
  const livePl = live.rows.reduce((sum, row) => sum + accruedProfit(row, live.plans.find((p) => p.id === row.plan_id), now, btcPrice), 0);
  const balance = cash - invested + livePl;
  const totalPl = profit + livePl;
  useEffect(() => {
    const name = sessionStorage.getItem("heroes-welcome");
    if (!name) return;
    setWelcomeName(name);
    sessionStorage.removeItem("heroes-welcome");
  }, []);
  const btcHolding = btcPrice ? Math.max(0, balance / btcPrice) : 0;
  const activePlans = live.rows.filter((row) => row.status === "active").length;
  const metrics = [
    { label: "Balance", value: `${balance < 0 ? "-" : ""}$${Math.abs(balance).toFixed(2)}`, icon: WalletCards, tone: "bg-metric-blue" },
    { label: "Profit / ROI", value: `${totalPl >= 0 ? "+" : "-"}$${Math.abs(totalPl).toFixed(2)}`, icon: TrendingUp, tone: "bg-metric-green" },
    { label: "Invested", value: `$${invested.toFixed(2)}`, icon: Gift, tone: "bg-metric-violet" },
    { label: "Deposits", value: `$${deposits.toFixed(2)}`, icon: ArrowDownToLine, tone: "bg-metric-teal" },
    { label: "Withdrawals", value: `$${withdrawals.toFixed(2)}`, icon: ArrowUpFromLine, tone: "bg-metric-orange" },
    { label: "Bitcoin", value: `${btcHolding.toFixed(6)} BTC`, icon: Bitcoin, tone: "bg-metric-gold", note: btcPrice ? `≈ $${Math.max(0, balance).toFixed(2)}` : "Price loading" },
  ];
  return <AccountShell eyebrow="Control room" title="Account overview">
    {welcomeName && <section className="mb-3 flex items-center justify-between gap-4 rounded-2xl border border-signal/40 bg-signal-soft p-5"><div><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-signal">Account ready</p><h2 className="mt-1 font-head text-xl font-semibold">Welcome to HeroesMarkets, {welcomeName}</h2><p className="mt-1 text-sm text-muted-foreground">Your trading account has been created successfully.</p></div><span className="hidden size-10 place-items-center rounded-xl bg-primary text-primary-foreground sm:grid">✓</span></section>}
    <section className="dashboard-welcome relative overflow-hidden rounded-xl border border-border p-6 sm:p-8">
      <div className="relative z-10 max-w-2xl">
        <p className="flex items-center gap-2 text-sm font-medium text-positive"><span className="size-2 rounded-full bg-positive" />Markets open</p>
        <h2 className="mt-4 flex items-center gap-2 font-head text-2xl font-semibold sm:text-3xl"><span className="min-w-0">Welcome back, {displayName}!</span><Rocket className="size-6 shrink-0 text-signal" aria-hidden="true" /></h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">Your journey to <span className="font-semibold text-foreground">financial freedom</span> starts here. Start trading today and watch your portfolio move with the market.</p>
        <Button asChild size="lg" className="mt-6 w-full sm:w-auto"><Link to="/deposit"><ArrowDownToLine /> Make a deposit &amp; start earning</Link></Button>
      </div>
    </section>

    <section className="mt-3 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border bg-card p-4 sm:p-5">
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-positive/10 text-positive"><CircleCheck className="size-5" /></span>
      <div className="min-w-0"><p className="font-head font-semibold">Account active</p><p className="truncate text-sm text-muted-foreground">Your trading account is ready</p></div>
      <span className="rounded-full bg-positive/10 px-3 py-1 text-xs font-semibold text-positive">Active</span>
    </section>

    <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-3">
      {metrics.map(({ label, value, icon: Icon, tone, note }) => <article key={label} className={`${tone} min-h-28 rounded-xl p-4 text-primary-foreground shadow-sm sm:p-5`}>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2"><p className="truncate text-[11px] font-medium uppercase sm:text-xs">{label}</p><Icon className="size-5 shrink-0 opacity-80" /></div>
        <p className="mt-3 break-words font-head text-lg font-semibold sm:text-2xl">{value}</p>
        {note && <p className="mt-1 text-xs opacity-75">{note}</p>}
      </article>)}
    </div>

    <nav className="mt-3 grid grid-cols-4 gap-2" aria-label="Quick account actions">
      {[{ to: "/deposit" as const, label: "Deposit", icon: ArrowDownToLine }, { to: "/withdraw" as const, label: "Withdraw", icon: ArrowUpFromLine }, { to: "/plans" as const, label: "Invest", icon: Layers }, { to: "/history" as const, label: "History", icon: History }].map(({ to, label, icon: Icon }) => <Link key={to} to={to} className="flex min-w-0 flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card px-1 py-4 text-xs text-muted-foreground transition-colors hover:border-signal hover:text-foreground sm:py-5 sm:text-sm"><Icon className="size-5 text-signal" /><span className="truncate">{label}</span></Link>)}
    </nav>

    <section className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="min-w-0"><h2 className="font-head text-lg font-semibold">Plan status</h2><p className="text-sm text-muted-foreground">{activePlans ? `${activePlans} active ${activePlans === 1 ? "plan" : "plans"} · ${tradeCount} recorded trades` : "No active plan"}</p></div>
      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${activePlans ? "bg-positive/10 text-positive" : "bg-muted text-muted-foreground"}`}>{activePlans ? "Active" : "Inactive"}</span>
    </section>
  </AccountShell>;
}