import { useEffect, useState } from "react";

export async function fetchBtcPrice(): Promise<number | null> {
  try {
    const res = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT");
    if (res.ok) {
      const json = (await res.json()) as { price?: string };
      const value = Number(json.price);
      if (Number.isFinite(value) && value > 0) return value;
    }
  } catch {
    /* fall through to the backup source */
  }
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd");
    if (res.ok) {
      const json = (await res.json()) as { bitcoin?: { usd?: number } };
      const value = Number(json.bitcoin?.usd);
      if (Number.isFinite(value) && value > 0) return value;
    }
  } catch {
    /* no price available */
  }
  return null;
}

/** Live BTC/USD price, refreshed every 10 seconds. */
export function useBtcPrice(intervalMs = 10000): number | null {
  const [price, setPrice] = useState<number | null>(null);
  useEffect(() => {
    let active = true;
    const tick = async () => {
      const value = await fetchBtcPrice();
      if (active && value !== null) setPrice(value);
    };
    void tick();
    const id = setInterval(() => void tick(), intervalMs);
    return () => { active = false; clearInterval(id); };
  }, [intervalMs]);
  return price;
}
