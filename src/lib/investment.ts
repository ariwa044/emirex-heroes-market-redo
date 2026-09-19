export type PlanLike = { roi_percent: number; duration_days: number };
export type InvestmentLike = {
  amount: number;
  started_at: string;
  ends_at: string | null;
  status: string;
  profit_override?: number | null;
  entry_btc_price?: number | null;
};

/**
 * Profit on a trade.
 * Priority: admin override → real BTC market move since the trade opened → 0.
 */
export function accruedProfit(inv: InvestmentLike, _plan: PlanLike | undefined, _now = Date.now(), btcPrice?: number | null): number {
  if (inv.profit_override !== null && inv.profit_override !== undefined) return Number(inv.profit_override);
  if (inv.status !== "active" && inv.status !== "completed") return 0;
  const entry = Number(inv.entry_btc_price ?? 0);
  if (!entry || !btcPrice || !Number.isFinite(btcPrice)) return 0;
  return Number(inv.amount) * (btcPrice / entry - 1);
}

export function progressPercent(inv: InvestmentLike, plan: PlanLike | undefined, now = Date.now()): number {
  if (!plan) return 0;
  const start = new Date(inv.started_at).getTime();
  const end = inv.ends_at ? new Date(inv.ends_at).getTime() : start + Number(plan.duration_days) * 86400000;
  if (end <= start) return 100;
  return Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
}

export function useMoney(value: number): string {
  return `${value < 0 ? "-" : ""}$${Math.abs(value).toFixed(2)}`;
}

export function signedMoney(value: number): string {
  return `${value >= 0 ? "+" : "-"}$${Math.abs(value).toFixed(2)}`;
}

/** Cash held from settled money movements. */
export function cashFromTransactions(rows: { type: string; amount: number; status: string }[]): number {
  return rows.reduce((sum, row) => {
    if (row.status === "rejected") return sum;
    if (row.type === "deposit") return row.status === "completed" ? sum + Number(row.amount) : sum;
    return sum - Number(row.amount);
  }, 0);
}
