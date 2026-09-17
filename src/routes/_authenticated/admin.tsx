import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { ShieldCheck, Wallet } from "lucide-react";
import { toast } from "sonner";
import { AccountShell } from "@/components/account-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/use-admin";
import { accruedProfit, cashFromTransactions } from "@/lib/investment";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin console | HeroesMarkets" }, { name: "description", content: "Manage member balances, profits and the website wallet." }, { property: "og:title", content: "Admin console | HeroesMarkets" }, { property: "og:description", content: "Manage member balances, profits and the website wallet." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: AdminPage,
});

type Profile = { user_id: string; display_name: string; username: string | null };
type Tx = { user_id: string; type: string; amount: number; status: string };
type Inv = { id: string; user_id: string; plan_id: string; amount: number; status: string; started_at: string; ends_at: string | null; profit_override: number | null };
type Plan = { id: string; name: string; roi_percent: number; duration_days: number };

function AdminPage() {
  const { user } = Route.useRouteContext();
  const isAdmin = useIsAdmin(user.id);
  const [checked, setChecked] = useState(false);
  const [address, setAddress] = useState("");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [invs, setInvs] = useState<Inv[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [balanceDraft, setBalanceDraft] = useState<Record<string, string>>({});
  const [profitDraft, setProfitDraft] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  useEffect(() => { const id = setTimeout(() => setChecked(true), 1200); return () => clearTimeout(id); }, []);

  const load = useCallback(async () => {
    const [{ data: s }, { data: p }, { data: t }, { data: i }, { data: pl }] = await Promise.all([
      supabase.from("site_settings").select("value").eq("key", "btc_address").maybeSingle(),
      supabase.from("profiles").select("user_id,display_name,username"),
      supabase.from("transactions").select("user_id,type,amount,status"),
      supabase.from("investments").select("id,user_id,plan_id,amount,status,started_at,ends_at,profit_override"),
      supabase.from("investment_plans").select("id,name,roi_percent,duration_days").order("sort_order"),
    ]);
    setAddress((s?.value as string | undefined) ?? "");
    setProfiles((p as Profile[]) ?? []);
    setTxs((t as Tx[]) ?? []);
    setInvs((i as Inv[]) ?? []);
    setPlans((pl as Plan[]) ?? []);
  }, []);

  useEffect(() => { if (isAdmin) void load(); }, [isAdmin, load]);

  if (!isAdmin) {
    return <AccountShell eyebrow="Restricted" title="Admin console">
      <div className="rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground">
        {checked ? "This area is reserved for administrators." : "Checking your access…"}
      </div>
    </AccountShell>;
  }

  async function saveAddress() {
    const value = address.trim();
    if (value.length < 20) { toast.error("Enter a valid wallet address."); return; }
    setBusy(true);
    const { error } = await supabase.from("site_settings").update({ value }).eq("key", "btc_address");
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Website wallet address updated.");
  }

  function cashFor(userId: string) {
    return cashFromTransactions(txs.filter((t) => t.user_id === userId));
  }
  function investedFor(userId: string) {
    return invs.filter((i) => i.user_id === userId && i.status === "active").reduce((s, i) => s + Number(i.amount), 0);
  }
  function profitFor(userId: string) {
    return invs.filter((i) => i.user_id === userId).reduce((s, i) => s + accruedProfit(i, plans.find((p) => p.id === i.plan_id), now), 0);
  }

  async function setBalance(userId: string) {
    const target = Number(balanceDraft[userId]);
    if (!Number.isFinite(target)) { toast.error("Enter a number."); return; }
    const current = cashFor(userId);
    const diff = Number((target - current).toFixed(2));
    if (diff === 0) { toast.message("Balance already at that amount."); return; }
    setBusy(true);
    const { error } = await supabase.from("transactions").insert({
      user_id: userId,
      type: diff > 0 ? "deposit" : "withdrawal",
      amount: Math.abs(diff),
      method: "crypto",
      status: "completed",
      note: "Admin balance adjustment",
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Balance updated.");
    setBalanceDraft((d) => ({ ...d, [userId]: "" }));
    void load();
  }

  async function setProfit(inv: Inv, clear = false) {
    const raw = profitDraft[inv.id];
    const value = clear ? null : Number(raw);
    if (!clear && !Number.isFinite(value as number)) { toast.error("Enter a number."); return; }
    setBusy(true);
    const { error } = await supabase.from("investments").update({ profit_override: value }).eq("id", inv.id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(clear ? "Profit back to automatic." : "Trade profit updated.");
    setProfitDraft((d) => ({ ...d, [inv.id]: "" }));
    void load();
  }

  return <AccountShell eyebrow="Control" title="Admin console">
    <section className="rounded-2xl border border-signal/40 bg-signal-soft p-6">
      <Wallet className="text-signal" />
      <h2 className="mt-4 font-head text-xl font-semibold">Website Bitcoin wallet</h2>
      <p className="mt-2 text-sm text-muted-foreground">Shown to every member on the deposit page.</p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-2">
          <Label htmlFor="btc">BTC address</Label>
          <Input id="btc" value={address} onChange={(e) => setAddress(e.target.value)} className="font-mono" />
        </div>
        <Button onClick={() => void saveAddress()} disabled={busy}>Save address</Button>
      </div>
    </section>

    <section className="mt-3 rounded-2xl border border-border bg-card p-6">
      <ShieldCheck className="text-signal" />
      <h2 className="mt-4 font-head text-xl font-semibold">Members</h2>
      {profiles.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">No members yet.</p> : <ul className="mt-4 space-y-4">
        {profiles.map((p) => {
          const cash = cashFor(p.user_id);
          const invested = investedFor(p.user_id);
          const profit = profitFor(p.user_id);
          const balance = cash - invested + profit;
          const rows = invs.filter((i) => i.user_id === p.user_id);
          return <li key={p.user_id} className="rounded-xl border border-border p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-head text-lg font-semibold">{p.display_name || "Member"}</p>
                <p className="text-xs text-muted-foreground">{p.username ? `@${p.username}` : p.user_id}</p>
              </div>
              <div className="text-right text-sm">
                <p className="font-head text-lg font-semibold">${balance.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">cash ${cash.toFixed(2)} · invested ${invested.toFixed(2)} · profit ${profit.toFixed(2)}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-2">
                <Label htmlFor={`bal-${p.user_id}`}>Set cash balance (USD)</Label>
                <Input id={`bal-${p.user_id}`} inputMode="decimal" placeholder={cash.toFixed(2)} value={balanceDraft[p.user_id] ?? ""} onChange={(e) => setBalanceDraft((d) => ({ ...d, [p.user_id]: e.target.value }))} />
              </div>
              <Button variant="outline" onClick={() => void setBalance(p.user_id)} disabled={busy}>Update balance</Button>
            </div>

            {rows.length > 0 && <div className="mt-5 space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-signal">Live trades</p>
              {rows.map((inv) => {
                const plan = plans.find((pl) => pl.id === inv.plan_id);
                const earned = accruedProfit(inv, plan, now);
                return <div key={inv.id} className="rounded-lg border border-border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span>{plan?.name ?? "Plan"} · ${Number(inv.amount).toFixed(2)} · {inv.status}</span>
                    <span className="font-head font-semibold text-positive">+${earned.toFixed(2)}{inv.profit_override !== null ? " (manual)" : ""}</span>
                  </div>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Input inputMode="decimal" placeholder="Set profit (USD)" value={profitDraft[inv.id] ?? ""} onChange={(e) => setProfitDraft((d) => ({ ...d, [inv.id]: e.target.value }))} />
                    <Button variant="outline" onClick={() => void setProfit(inv)} disabled={busy}>Set profit</Button>
                    {inv.profit_override !== null && <Button variant="ghost" onClick={() => void setProfit(inv, true)} disabled={busy}>Auto</Button>}
                  </div>
                </div>;
              })}
            </div>}
          </li>;
        })}
      </ul>}
    </section>
  </AccountShell>;
}
