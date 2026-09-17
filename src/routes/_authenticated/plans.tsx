import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Activity, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { AccountShell } from "@/components/account-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { accruedProfit, progressPercent } from "@/lib/investment";

export const Route = createFileRoute("/_authenticated/plans")({
  head: () => ({ meta: [{ title: "Investment plans | HeroesMarkets" }, { name: "description", content: "Choose a HeroesMarkets investment plan and start earning." }, { property: "og:title", content: "Investment plans | HeroesMarkets" }, { property: "og:description", content: "Choose a HeroesMarkets investment plan and start earning." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: PlansPage,
});

type Plan = { id: string; name: string; description: string; min_amount: number; max_amount: number | null; roi_percent: number; duration_days: number };
type Investment = { id: string; amount: number; expected_return: number; status: string; started_at: string; ends_at: string | null; plan_id: string };

function PlansPage() {
  const { user } = Route.useRouteContext();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [selected, setSelected] = useState<Plan | null>(null);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  async function load() {
    const [{ data: p }, { data: inv }] = await Promise.all([
      supabase.from("investment_plans").select("id,name,description,min_amount,max_amount,roi_percent,duration_days").order("sort_order"),
      supabase.from("investments").select("id,amount,expected_return,status,started_at,ends_at,plan_id").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);
    setPlans((p as Plan[]) ?? []);
    setInvestments((inv as Investment[]) ?? []);
  }
  useEffect(() => { void load(); }, [user.id]);

  async function invest(event: React.FormEvent) {
    event.preventDefault();
    if (!selected) return;
    const value = Number(amount);
    if (!Number.isFinite(value) || value < Number(selected.min_amount)) { toast.error(`Minimum for ${selected.name} is $${Number(selected.min_amount).toFixed(0)}.`); return; }
    if (selected.max_amount && value > Number(selected.max_amount)) { toast.error(`Maximum for ${selected.name} is $${Number(selected.max_amount).toFixed(0)}.`); return; }
    setBusy(true);
    const ends = new Date(Date.now() + selected.duration_days * 86400000).toISOString();
    const { error } = await supabase.from("investments").insert({ user_id: user.id, plan_id: selected.id, amount: value, expected_return: Number((value * (1 + Number(selected.roi_percent) / 100)).toFixed(2)), ends_at: ends, status: "active" });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Live trade started — ${selected.name} plan, $${value.toFixed(2)}.`);
    setAmount(""); setSelected(null);
    void load();
  }

  const planFor = (id: string) => plans.find((p) => p.id === id);
  const liveProfit = investments.reduce((sum, row) => sum + accruedProfit(row, planFor(row.plan_id), now), 0);

  return <AccountShell eyebrow="Grow" title="Investment plans">
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {plans.map((plan) => <article key={plan.id} className={`rounded-2xl border bg-card p-6 transition-colors ${selected?.id === plan.id ? "border-signal" : "border-border"}`}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-signal">{plan.name}</p>
        <p className="mt-3 font-head text-3xl font-semibold">{Number(plan.roi_percent).toFixed(0)}%</p>
        <p className="text-xs text-muted-foreground">return over {plan.duration_days} days</p>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">{plan.description}</p>
        <p className="mt-4 text-xs text-muted-foreground">${Number(plan.min_amount).toFixed(0)} {plan.max_amount ? `– $${Number(plan.max_amount).toFixed(0)}` : "and above"}</p>
        <Button className="mt-5 w-full" variant={selected?.id === plan.id ? "default" : "outline"} onClick={() => { setSelected(plan); setAmount(String(plan.min_amount)); }}>
          <Activity /> Live trade now
        </Button>
      </article>)}
    </div>

    {selected && <form onSubmit={invest} className="mt-3 rounded-2xl border border-signal/40 bg-signal-soft p-6">
      <TrendingUp className="text-signal" />
      <h2 className="mt-4 font-head text-xl font-semibold">Start a live trade on {selected.name}</h2>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-2">
          <Label htmlFor="iamount">Amount (USD)</Label>
          <Input id="iamount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <Button type="submit" disabled={busy}>{busy ? "Starting…" : "Live trade now"}</Button>
        <Button type="button" variant="ghost" onClick={() => setSelected(null)}>Cancel</Button>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Profit accrues live at {Number(selected.roi_percent).toFixed(0)}% over {selected.duration_days} days — projected payout ${(Number(amount || 0) * (1 + Number(selected.roi_percent) / 100)).toFixed(2)}.</p>
    </form>}

    <section className="mt-3 rounded-2xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-head text-xl font-semibold">Your live trades</h2>
        <p className="text-sm text-muted-foreground">Live profit <span className="font-head text-lg font-semibold text-positive">+${liveProfit.toFixed(2)}</span></p>
      </div>
      {investments.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">No live trades yet — pick a plan above and hit Live trade now.</p> : <ul className="mt-4 divide-y divide-border">
        {investments.map((row) => {
          const plan = planFor(row.plan_id);
          const earned = accruedProfit(row, plan, now);
          const pct = progressPercent(row, plan, now);
          return <li key={row.id} className="py-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-medium">{plan?.name ?? "Plan"} · ${Number(row.amount).toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Started {new Date(row.started_at).toLocaleDateString()}{row.ends_at ? ` · Matures ${new Date(row.ends_at).toLocaleDateString()}` : ""}</p>
              </div>
              <div className="text-right">
                <p className="font-head text-lg font-semibold text-positive">+${earned.toFixed(2)}</p>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{row.status} · target ${Number(row.expected_return).toFixed(2)}</p>
              </div>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-background"><div className="h-full rounded-full bg-signal transition-all" style={{ width: `${pct}%` }} /></div>
          </li>;
        })}
      </ul>}
    </section>
  </AccountShell>;
}
