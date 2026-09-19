import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowUpFromLine } from "lucide-react";
import { toast } from "sonner";
import { AccountShell } from "@/components/account-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/withdraw")({
  head: () => ({ meta: [{ title: "Withdraw funds | HeroesMarkets" }, { name: "description", content: "Withdraw available funds from your HeroesMarkets account." }, { property: "og:title", content: "Withdraw funds | HeroesMarkets" }, { property: "og:description", content: "Withdraw available funds from your HeroesMarkets account." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: WithdrawPage,
});

type Row = { id: string; type: string; amount: number; method: string; status: string; created_at: string; withdrawal_progress: number; withdrawal_paused: boolean };

function WithdrawPage() {
  const { user } = Route.useRouteContext();
  const [amount, setAmount] = useState("");
  const [destination, setDestination] = useState("");
  const [method, setMethod] = useState<"crypto" | "bank_transfer">("crypto");
  const [bank, setBank] = useState({ bankName: "", accountName: "", accountNumber: "", routing: "", swift: "", country: "" });
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [balance, setBalance] = useState(0);

  async function load() {
    const [{ data: all }, { data: mine }] = await Promise.all([
      supabase.from("transactions").select("type,amount,status").eq("user_id", user.id),
      supabase.from("transactions").select("id,type,amount,method,status,created_at,withdrawal_progress,withdrawal_paused").eq("user_id", user.id).eq("type", "withdrawal").order("created_at", { ascending: false }).limit(8),
    ]);
    const total = (all ?? []).reduce((sum, row) => {
      if (row.status === "rejected") return sum;
      return row.type === "deposit" ? (row.status === "completed" ? sum + Number(row.amount) : sum) : sum - Number(row.amount);
    }, 0);
    setBalance(total);
    setRows((mine as Row[]) ?? []);
  }
  useEffect(() => { void load(); }, [user.id]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const value = Number(amount);
    if (!Number.isFinite(value) || value < 20) { toast.error("Minimum withdrawal is $20."); return; }
    if (value > balance) { toast.error("Amount exceeds your available balance."); return; }
    let note = "";
    if (method === "crypto") {
      if (destination.trim().length < 4) { toast.error("Enter the BTC wallet to pay out to."); return; }
      note = `BTC wallet: ${destination.trim()}`;
    } else {
      if (bank.bankName.trim().length < 2) { toast.error("Enter your bank name."); return; }
      if (bank.accountName.trim().length < 2) { toast.error("Enter the account holder name."); return; }
      if (bank.accountNumber.trim().length < 5) { toast.error("Enter a valid account number or IBAN."); return; }
      if (bank.country.trim().length < 2) { toast.error("Enter the bank country."); return; }
      note = [
        `Bank: ${bank.bankName.trim()}`,
        `Account name: ${bank.accountName.trim()}`,
        `Account/IBAN: ${bank.accountNumber.trim()}`,
        bank.routing.trim() ? `Routing/Sort code: ${bank.routing.trim()}` : "",
        bank.swift.trim() ? `SWIFT/BIC: ${bank.swift.trim()}` : "",
        `Country: ${bank.country.trim()}`,
      ].filter(Boolean).join(" · ").slice(0, 900);
    }
    setBusy(true);
    const { error } = await supabase.from("transactions").insert({ user_id: user.id, type: "withdrawal", amount: value, method, note });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Withdrawal request submitted for review.");
    setAmount(""); setDestination(""); setBank({ bankName: "", accountName: "", accountNumber: "", routing: "", swift: "", country: "" });
    void load();
  }

  return <AccountShell eyebrow="Funding" title="Withdraw funds">
    <div className="grid gap-3 lg:grid-cols-[1fr_1fr]">
      <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-6">
        <ArrowUpFromLine className="text-signal" />
        <h2 className="mt-4 font-head text-xl font-semibold">Request a payout</h2>
        <p className="mt-2 text-sm text-muted-foreground">Available balance <span className="font-semibold text-foreground">${balance.toFixed(2)}</span>. Minimum withdrawal $20.</p>
        <div className="mt-6 space-y-2">
          <Label htmlFor="wamount">Amount (USD)</Label>
          <Input id="wamount" inputMode="decimal" placeholder="250" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div className="mt-5 space-y-2">
          <Label>Payout method</Label>
          <div className="grid grid-cols-2 gap-2">
            {(["crypto", "bank_transfer"] as const).map((m) => <button key={m} type="button" onClick={() => setMethod(m)} className={`rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${method === m ? "border-signal bg-signal-soft text-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}>
              {m === "crypto" ? "Bitcoin" : "Bank transfer"}
            </button>)}
          </div>
        </div>
        {method === "crypto" ? <div className="mt-5 space-y-2">
          <Label htmlFor="destination">Your BTC wallet address</Label>
          <Input id="destination" placeholder="Bitcoin wallet address" value={destination} onChange={(e) => setDestination(e.target.value)} />
          <p className="text-xs text-muted-foreground">Double-check the address before submitting.</p>
        </div> : <div className="mt-5 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bankName">Bank name</Label>
            <Input id="bankName" placeholder="e.g. First National Bank" value={bank.bankName} onChange={(e) => setBank({ ...bank, bankName: e.target.value })} maxLength={100} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="accountName">Account holder name</Label>
            <Input id="accountName" placeholder="Name exactly as on the account" value={bank.accountName} onChange={(e) => setBank({ ...bank, accountName: e.target.value })} maxLength={100} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="accountNumber">Account number / IBAN</Label>
            <Input id="accountNumber" placeholder="Account number or IBAN" value={bank.accountNumber} onChange={(e) => setBank({ ...bank, accountNumber: e.target.value })} maxLength={64} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="routing">Routing / sort code <span className="text-muted-foreground">(optional)</span></Label>
              <Input id="routing" placeholder="Routing or sort code" value={bank.routing} onChange={(e) => setBank({ ...bank, routing: e.target.value })} maxLength={32} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="swift">SWIFT / BIC <span className="text-muted-foreground">(optional)</span></Label>
              <Input id="swift" placeholder="SWIFT or BIC code" value={bank.swift} onChange={(e) => setBank({ ...bank, swift: e.target.value })} maxLength={20} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bankCountry">Bank country</Label>
            <Input id="bankCountry" placeholder="Country where the account is held" value={bank.country} onChange={(e) => setBank({ ...bank, country: e.target.value })} maxLength={60} />
          </div>
          <p className="text-xs text-muted-foreground">Bank payouts are reviewed manually and usually settle in 1–3 business days.</p>
        </div>}
        <Button type="submit" className="mt-6 w-full" disabled={busy}>{busy ? "Submitting…" : "Request withdrawal"}</Button>
      </form>
      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-head text-xl font-semibold">Recent withdrawals</h2>
        {rows.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">No withdrawals yet.</p> : <ul className="mt-4 divide-y divide-border">
          {rows.map((row) => <li key={row.id} className="py-4 text-sm">
            <div className="flex items-center justify-between gap-3">
              <div><p className="font-medium">${Number(row.amount).toFixed(2)}</p><p className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleString()} · {row.method.replace("_", " ")}</p></div>
              <span className="rounded-full border border-border px-2.5 py-1 text-[11px] uppercase tracking-wide text-muted-foreground">{row.status}</span>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label={`Withdrawal progress ${row.withdrawal_progress}%`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={row.withdrawal_progress}>
                <div className={`h-full rounded-full transition-[width] duration-500 ${row.withdrawal_paused ? "bg-signal" : "bg-positive"}`} style={{ width: `${row.withdrawal_progress}%` }} />
              </div>
              <span className="w-10 text-right text-xs font-semibold tabular-nums">{row.withdrawal_progress}%</span>
            </div>
            {row.withdrawal_paused && <p className="mt-3 rounded-lg border border-signal/50 bg-signal-soft p-3 text-xs text-foreground">
              An upgrade is needed to process the withdrawal. Please reach out to customer support for assistance.
            </p>}
          </li>)}
        </ul>}
      </section>
    </div>
  </AccountShell>;
}
