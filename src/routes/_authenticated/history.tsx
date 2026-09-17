import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { History } from "lucide-react";
import { AccountShell } from "@/components/account-shell";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({ meta: [{ title: "Trading History | HeroesMarkets" }, { name: "description", content: "Review your HeroesMarkets trading activity." }, { property: "og:title", content: "Trading History | HeroesMarkets" }, { property: "og:description", content: "Review your HeroesMarkets trading activity." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: HistoryPage,
});

function HistoryPage() {
  const { user } = Route.useRouteContext();
  const [rows, setRows] = useState<Tables<"trading_history">[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { supabase.from("trading_history").select("*").eq("user_id", user.id).order("opened_at", { ascending: false }).then(({ data }) => { setRows(data ?? []); setLoading(false); }); }, [user.id]);
  return <AccountShell eyebrow="Activity" title="Trading history"><section className="overflow-hidden rounded-2xl border border-border bg-card">
    {loading ? <p className="p-8 text-sm text-muted-foreground">Loading trading history…</p> : rows.length === 0 ? <div className="grid min-h-72 place-items-center p-8 text-center"><div><span className="mx-auto grid size-12 place-items-center rounded-xl bg-signal-soft text-signal"><History /></span><h2 className="mt-5 font-head text-xl font-semibold">No trades recorded yet</h2><p className="mt-2 text-sm text-muted-foreground">Your executed positions will appear here.</p></div></div> : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-border text-[11px] uppercase tracking-[0.16em] text-muted-foreground"><tr>{["Instrument","Side","Quantity","Entry","Exit","P/L","Status","Opened"].map((h)=><th key={h} className="px-5 py-4 font-medium">{h}</th>)}</tr></thead><tbody>{rows.map((row)=><tr key={row.id} className="border-b border-border/70 last:border-0"><td className="px-5 py-4 font-semibold">{row.instrument}</td><td className="px-5 py-4 uppercase">{row.side}</td><td className="px-5 py-4">{row.quantity}</td><td className="px-5 py-4">{row.entry_price}</td><td className="px-5 py-4">{row.exit_price ?? "—"}</td><td className={`px-5 py-4 font-semibold ${(row.profit_loss ?? 0) >= 0 ? "text-positive" : "text-signal"}`}>{row.profit_loss == null ? "—" : `$${row.profit_loss.toFixed(2)}`}</td><td className="px-5 py-4 capitalize">{row.status}</td><td className="px-5 py-4 text-muted-foreground">{new Date(row.opened_at).toLocaleDateString()}</td></tr>)}</tbody></table></div>}
  </section></AccountShell>;
}