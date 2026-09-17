import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowDownToLine } from "lucide-react";
import { toast } from "sonner";
import { AccountShell } from "@/components/account-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useBtcAddress } from "@/lib/site-settings";

export const Route = createFileRoute("/_authenticated/deposit")({
  head: () => ({ meta: [{ title: "Deposit funds | HeroesMarkets" }, { name: "description", content: "Fund your HeroesMarkets trading account." }, { property: "og:title", content: "Deposit funds | HeroesMarkets" }, { property: "og:description", content: "Fund your HeroesMarkets trading account." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: DepositPage,
});

type Row = { id: string; type: string; amount: number; method: string; status: string; created_at: string };

function DepositPage() {
  const { user } = Route.useRouteContext();
  const BTC_ADDRESS = useBtcAddress();
  const [amount, setAmount] = useState("");
  const method = "crypto";
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);

  async function load() {
    const { data } = await supabase.from("transactions").select("id,type,amount,method,status,created_at").eq("user_id", user.id).eq("type", "deposit").order("created_at", { ascending: false }).limit(8);
    setRows((data as Row[]) ?? []);
  }
  useEffect(() => { void load(); }, [user.id]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const value = Number(amount);
    if (!Number.isFinite(value) || value < 50) { toast.error("Minimum deposit is $50."); return; }
    setBusy(true);
    const { error } = await supabase.from("transactions").insert({ user_id: user.id, type: "deposit", amount: value, method });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Deposit request submitted. It will show as completed once funds clear.");
    setAmount("");
    void load();
  }

  return <AccountShell eyebrow="Funding" title="Deposit funds">
    <div className="grid gap-3 lg:grid-cols-[1fr_1fr]">
      <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-6">
        <ArrowDownToLine className="text-signal" />
        <h2 className="mt-4 font-head text-xl font-semibold">Add money to your account</h2>
        <p className="mt-2 text-sm text-muted-foreground">Bitcoin only. Minimum deposit $50. Funds appear after 2 network confirmations.</p>
        <div className="mt-6 space-y-2">
          <Label htmlFor="amount">Amount (USD)</Label>
          <Input id="amount" inputMode="decimal" placeholder="500" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div className="mt-5 space-y-2">
          <Label>Send BTC to this address</Label>
          <div className="rounded-xl border border-signal bg-signal-soft px-4 py-3">
            <p className="break-all font-mono text-sm">{BTC_ADDRESS}</p>
            <button type="button" onClick={() => { void navigator.clipboard.writeText(BTC_ADDRESS); toast.success("BTC address copied."); }} className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-signal">Copy address</button>
          </div>
          <p className="text-xs text-muted-foreground">Send only BTC to this address. Submit the form after sending so we can match your payment.</p>
        </div>
        <Button type="submit" className="mt-6 w-full" disabled={busy}>{busy ? "Submitting…" : "Deposit now"}</Button>
      </form>
      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-head text-xl font-semibold">Recent deposits</h2>
        {rows.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">No deposits yet.</p> : <ul className="mt-4 divide-y divide-border">
          {rows.map((row) => <li key={row.id} className="flex items-center justify-between py-3 text-sm">
            <div><p className="font-medium">${Number(row.amount).toFixed(2)}</p><p className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleString()} · {row.method.replace("_", " ")}</p></div>
            <span className="rounded-full border border-border px-2.5 py-1 text-[11px] uppercase tracking-wide text-muted-foreground">{row.status}</span>
          </li>)}
        </ul>}
      </section>
    </div>
  </AccountShell>;
}
