import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ArrowUpFromLine, Coins, Pause, Play, TrendingUp, UserRound, Wallet } from "lucide-react";
import { toast } from "sonner";
import { AccountShell } from "@/components/account-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/use-admin";
import { accruedProfit, cashFromTransactions, signedMoney } from "@/lib/investment";
import { useBtcPrice } from "@/lib/crypto-price";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin console | HeroesMarkets" }, { name: "description", content: "Manage member balances, profits and the website wallet." }, { property: "og:title", content: "Admin console | HeroesMarkets" }, { property: "og:description", content: "Manage member balances, profits and the website wallet." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: AdminPage,
});

type Profile = { user_id: string; display_name: string; username: string | null; upgrade_required: boolean; account_on_hold: boolean; manual_profit: number | null; manual_withdrawals: number | null; manual_bitcoin: number | null };
type Tx = { id: string; user_id: string; type: string; amount: number; status: string; withdrawal_progress: number; withdrawal_paused: boolean; created_at: string };
type Inv = { id: string; user_id: string; plan_id: string; amount: number; status: string; started_at: string; ends_at: string | null; profit_override: number | null; entry_btc_price: number | null };
type Plan = { id: string; name: string; roi_percent: number; duration_days: number };

function memberName(p: Profile | undefined) {
  return p?.display_name || p?.username || "Member";
}

function AdminPage() {
  const { user } = Route.useRouteContext();
  const isAdmin = useIsAdmin(user.id);
  const [checked, setChecked] = useState(false);
  const [address, setAddress] = useState("");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [invs, setInvs] = useState<Inv[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [balanceDraft, setBalanceDraft] = useState("");
  const [tileDraft, setTileDraft] = useState({ profit: "", withdrawals: "", bitcoin: "" });
  const [profitDraft, setProfitDraft] = useState<Record<string, string>>({});
  const [withdrawalDraft, setWithdrawalDraft] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const btcPrice = useBtcPrice();

  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  useEffect(() => { const id = setTimeout(() => setChecked(true), 1200); return () => clearTimeout(id); }, []);

  const load = useCallback(async () => {
    const [{ data: s }, { data: p }, { data: t }, { data: i }, { data: pl }] = await Promise.all([
      supabase.from("site_settings").select("value").eq("key", "btc_address").maybeSingle(),
      supabase.from("profiles").select("user_id,display_name,username,upgrade_required,account_on_hold,manual_profit,manual_withdrawals,manual_bitcoin"),
      supabase.from("transactions").select("id,user_id,type,amount,status,withdrawal_progress,withdrawal_paused,created_at"),
      supabase.from("investments").select("id,user_id,plan_id,amount,status,started_at,ends_at,profit_override,entry_btc_price"),
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

  async function toggleUpgrade(p: Profile) {
    const next = !p.upgrade_required;
    setBusy(true);
    const { error } = await supabase.from("profiles").update({ upgrade_required: next }).eq("user_id", p.user_id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(next ? "Upgrade warning shown — account locked." : "Account activated.");
    await load();
  }

  async function toggleAccountHold(p: Profile) {
    const next = !p.account_on_hold;
    setBusy(true);
    const { error } = await supabase.from("profiles").update({ account_on_hold: next }).eq("user_id", p.user_id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(next ? "Account placed on hold." : "Account restored.");
    await load();
  }

  function cashFor(userId: string) {
    return cashFromTransactions(txs.filter((t) => t.user_id === userId));
  }
  function investedFor(userId: string) {
    return invs.filter((i) => i.user_id === userId && i.status === "active").reduce((s, i) => s + Number(i.amount), 0);
  }
  function profitFor(userId: string) {
    return invs.filter((i) => i.user_id === userId).reduce((s, i) => s + accruedProfit(i, plans.find((p) => p.id === i.plan_id), now, btcPrice), 0);
  }

  async function setBalance(userId: string) {
    const target = Number(balanceDraft);
    if (!Number.isFinite(target) || balanceDraft.trim() === "") { toast.error("Enter a number."); return; }
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
    setBalanceDraft("");
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

  async function setWithdrawalProgress(tx: Tx) {
    const value = Number(withdrawalDraft[tx.id] ?? tx.withdrawal_progress);
    if (!Number.isInteger(value) || value < 0 || value > 100) { toast.error("Enter a whole number from 0 to 100."); return; }
    setBusy(true);
    const { error } = await supabase.from("transactions").update({ withdrawal_progress: value }).eq("id", tx.id).eq("type", "withdrawal");
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(value === 100 ? "Withdrawal completed." : `Withdrawal progress set to ${value}%.`);
    setWithdrawalDraft((drafts) => ({ ...drafts, [tx.id]: "" }));
    void load();
  }

  async function toggleWithdrawalPause(tx: Tx) {
    const paused = !tx.withdrawal_paused;
    setBusy(true);
    const { error } = await supabase.from("transactions").update({ withdrawal_paused: paused }).eq("id", tx.id).eq("type", "withdrawal");
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(paused ? "Withdrawal paused — upgrade notice shown to the member." : "Withdrawal resumed.");
    void load();
  }

  async function saveTiles(p: Profile) {
    const parse = (raw: string, current: number | null) => {
      const value = raw.trim();
      if (value === "") return current;
      const n = Number(value);
      return Number.isFinite(n) ? n : current;
    };
    setBusy(true);
    const { error } = await supabase.from("profiles").update({
      manual_profit: parse(tileDraft.profit, p.manual_profit),
      manual_withdrawals: parse(tileDraft.withdrawals, p.manual_withdrawals),
      manual_bitcoin: parse(tileDraft.bitcoin, p.manual_bitcoin),
    }).eq("user_id", p.user_id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Member dashboard figures updated.");
    setTileDraft({ profit: "", withdrawals: "", bitcoin: "" });
    void load();
  }

  async function clearTiles(p: Profile) {
    setBusy(true);
    const { error } = await supabase.from("profiles").update({ manual_profit: null, manual_withdrawals: null, manual_bitcoin: null }).eq("user_id", p.user_id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Back to automatic figures.");
    setTileDraft({ profit: "", withdrawals: "", bitcoin: "" });
    void load();
  }

  function openMember(userId: string) {
    setSelectedUserId(userId);
    setBalanceDraft("");
    setTileDraft({ profit: "", withdrawals: "", bitcoin: "" });
  }

  const selected = profiles.find((p) => p.user_id === selectedUserId) ?? null;

  const walletSection = <section className="rounded-2xl border border-signal/40 bg-signal-soft p-6">
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
  </section>;

  if (!selected) {
    return <AccountShell eyebrow="Control" title="Admin console">
      {walletSection}

      <section className="mt-3 rounded-2xl border border-border bg-card p-6">
        <UserRound className="text-signal" />
        <h2 className="mt-4 font-head text-xl font-semibold">Members</h2>
        <p className="mt-2 text-sm text-muted-foreground">Select a member to manage their balance, trades, withdrawals and account status.</p>
        {profiles.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">No members yet.</p> : <ul className="mt-4 space-y-2">
          {profiles.map((p) => {
            const cash = cashFor(p.user_id);
            const invested = investedFor(p.user_id);
            const profit = profitFor(p.user_id);
            const balance = cash - invested + profit;
            return <li key={p.user_id}>
              <button type="button" onClick={() => openMember(p.user_id)} className="flex w-full flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4 text-left transition-colors hover:border-signal/60 hover:bg-muted/40">
                <div className="min-w-0">
                  <p className="truncate font-head font-semibold">{memberName(p)}</p>
                  <p className="text-xs text-muted-foreground">{p.username ? `@${p.username}` : p.user_id}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {p.upgrade_required && <span className="rounded-full border border-signal/50 bg-signal-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-signal">Upgrade required</span>}
                    {p.account_on_hold && <span className="rounded-full border border-signal/50 bg-signal-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-signal">On hold</span>}
                  </div>
                </div>
                <div className="text-right text-sm">
                  <p className="font-head font-semibold">${balance.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">{invs.filter((i) => i.user_id === p.user_id).length} trades · {txs.filter((t) => t.user_id === p.user_id && t.type === "withdrawal").length} withdrawals</p>
                </div>
              </button>
            </li>;
          })}
        </ul>}
      </section>
    </AccountShell>;
  }

  const cash = cashFor(selected.user_id);
  const invested = investedFor(selected.user_id);
  const profit = profitFor(selected.user_id);
  const balance = cash - invested + profit;
  const memberTrades = invs.filter((i) => i.user_id === selected.user_id).sort((a, b) => Date.parse(b.started_at) - Date.parse(a.started_at));
  const memberWithdrawals = txs.filter((tx) => tx.user_id === selected.user_id && tx.type === "withdrawal" && tx.status !== "rejected").sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));

  return <AccountShell eyebrow="Control" title={memberName(selected)}>
    <Button variant="ghost" size="sm" onClick={() => setSelectedUserId(null)} className="mb-3">
      <ArrowLeft className="mr-2 size-4" />Back to members
    </Button>

    <section className="rounded-2xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-head text-lg font-semibold">{memberName(selected)}</p>
          <p className="text-xs text-muted-foreground">{selected.username ? `@${selected.username}` : selected.user_id}</p>
        </div>
        <div className="text-right text-sm">
          <p className="font-head text-lg font-semibold">${balance.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">cash ${cash.toFixed(2)} · invested ${invested.toFixed(2)} · profit ${profit.toFixed(2)}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-2">
          <Label htmlFor={`bal-${selected.user_id}`}>Set cash balance (USD)</Label>
          <Input id={`bal-${selected.user_id}`} inputMode="decimal" placeholder={cash.toFixed(2)} value={balanceDraft} onChange={(e) => setBalanceDraft(e.target.value)} />
        </div>
        <Button variant="outline" onClick={() => void setBalance(selected.user_id)} disabled={busy}>Update balance</Button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button variant={selected.upgrade_required ? "default" : "outline"} onClick={() => void toggleUpgrade(selected)} disabled={busy}>
          {selected.upgrade_required ? "Activate account" : "Upgrade"}
        </Button>
        <Button variant={selected.account_on_hold ? "default" : "outline"} onClick={() => void toggleAccountHold(selected)} disabled={busy}>
          {selected.account_on_hold ? "Restore account" : "Place on hold"}
        </Button>
        {selected.upgrade_required && <span className="text-xs text-signal">Account locked — upgrade warning shown to this member.</span>}
        {selected.account_on_hold && <span className="text-xs text-signal">Account on hold — this member cannot use their account.</span>}
      </div>
    </section>

    <section className="mt-3 rounded-2xl border border-border bg-card p-6">
      <Coins className="text-signal" />
      <h2 className="mt-4 font-head text-xl font-semibold">Dashboard figures</h2>
      <p className="mt-2 text-sm text-muted-foreground">Type a value to show it on this member&apos;s dashboard. Leave a box empty to keep what is there now.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor={`mp-${selected.user_id}`}>Profit / ROI (USD)</Label>
          <Input id={`mp-${selected.user_id}`} inputMode="decimal" placeholder={selected.manual_profit === null ? "automatic" : String(selected.manual_profit)} value={tileDraft.profit} onChange={(e) => setTileDraft((d) => ({ ...d, profit: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`mw-${selected.user_id}`}>Withdrawals (USD)</Label>
          <Input id={`mw-${selected.user_id}`} inputMode="decimal" placeholder={selected.manual_withdrawals === null ? "automatic" : String(selected.manual_withdrawals)} value={tileDraft.withdrawals} onChange={(e) => setTileDraft((d) => ({ ...d, withdrawals: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`mb-${selected.user_id}`}>Bitcoin (BTC)</Label>
          <Input id={`mb-${selected.user_id}`} inputMode="decimal" placeholder={selected.manual_bitcoin === null ? "automatic" : String(selected.manual_bitcoin)} value={tileDraft.bitcoin} onChange={(e) => setTileDraft((d) => ({ ...d, bitcoin: e.target.value }))} />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => void saveTiles(selected)} disabled={busy}>Save figures</Button>
        <Button variant="ghost" onClick={() => void clearTiles(selected)} disabled={busy}>Back to automatic</Button>
      </div>
    </section>

    <section className="mt-3 rounded-2xl border border-border bg-card p-6">
      <TrendingUp className="text-signal" />
      <h2 className="mt-4 font-head text-xl font-semibold">Live trades</h2>
      {memberTrades.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">This member has no trades yet.</p> : <div className="mt-5 space-y-3">
        {memberTrades.map((inv) => {
          const plan = plans.find((pl) => pl.id === inv.plan_id);
          const earned = accruedProfit(inv, plan, now, btcPrice);
          return <div key={inv.id} className="rounded-lg border border-border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span>{plan?.name ?? "Plan"} · ${Number(inv.amount).toFixed(2)} · {inv.status}</span>
              <span className={`font-head font-semibold ${earned >= 0 ? "text-positive" : "text-signal"}`}>{signedMoney(earned)}{inv.profit_override !== null ? " (manual)" : ""}</span>
            </div>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input inputMode="decimal" placeholder="Set profit (USD)" value={profitDraft[inv.id] ?? ""} onChange={(e) => setProfitDraft((d) => ({ ...d, [inv.id]: e.target.value }))} />
              <Button variant="outline" onClick={() => void setProfit(inv)} disabled={busy}>Set profit</Button>
              {inv.profit_override !== null && <Button variant="ghost" onClick={() => void setProfit(inv, true)} disabled={busy}>Auto</Button>}
            </div>
          </div>;
        })}
      </div>}
    </section>

    <section className="mt-3 rounded-2xl border border-border bg-card p-6">
      <ArrowUpFromLine className="text-signal" />
      <h2 className="mt-4 font-head text-xl font-semibold">Withdrawal progress</h2>
      <p className="mt-2 text-sm text-muted-foreground">Update each payout from 0 to 100. At 100%, it is marked completed automatically.</p>
      {memberWithdrawals.length === 0 ? <p className="mt-5 text-sm text-muted-foreground">No withdrawal requests yet.</p> : <ul className="mt-5 space-y-3">
        {memberWithdrawals.map((tx) => <li key={tx.id} className="rounded-lg border border-border p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className="mt-1 text-xs text-muted-foreground">${Number(tx.amount).toFixed(2)} · {new Date(tx.created_at).toLocaleString()}</p>
            <span className="text-xs font-semibold uppercase text-muted-foreground">{tx.withdrawal_paused ? "paused" : tx.status}</span>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label={`Withdrawal progress ${tx.withdrawal_progress}%`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={tx.withdrawal_progress}>
              <div className={`h-full rounded-full transition-[width] duration-500 ${tx.withdrawal_paused ? "bg-signal" : "bg-positive"}`} style={{ width: `${tx.withdrawal_progress}%` }} />
            </div>
            <span className="w-10 text-right text-xs font-semibold tabular-nums">{tx.withdrawal_progress}%</span>
          </div>
          {tx.withdrawal_paused && <p className="mt-3 rounded-lg border border-signal/50 bg-signal-soft p-3 text-xs">Member sees: “An upgrade is needed to process the withdrawal. Please reach out to customer support for assistance.”</p>}
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Input type="number" min={0} max={100} step={1} aria-label="Withdrawal progress percentage" placeholder={String(tx.withdrawal_progress)} value={withdrawalDraft[tx.id] ?? ""} onChange={(event) => setWithdrawalDraft((drafts) => ({ ...drafts, [tx.id]: event.target.value }))} />
            <Button variant="outline" onClick={() => void setWithdrawalProgress(tx)} disabled={busy}>Update progress</Button>
            <Button variant={tx.withdrawal_paused ? "default" : "ghost"} onClick={() => void toggleWithdrawalPause(tx)} disabled={busy}>
              {tx.withdrawal_paused ? <><Play className="mr-2 size-4" />Resume</> : <><Pause className="mr-2 size-4" />Pause</>}
            </Button>
          </div>
        </li>)}
      </ul>}
    </section>
  </AccountShell>;
}
