import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const FALLBACK_BTC_ADDRESS = "1b4oTt9vYJpq2SaNMZRahbDaU3FQMePUg";

export async function getSetting(key: string): Promise<string | null> {
  const { data } = await supabase.from("site_settings").select("value").eq("key", key).maybeSingle();
  return (data?.value as string | undefined) ?? null;
}

/** The website's Bitcoin receiving address, editable by an admin. */
export function useBtcAddress(): string {
  const [address, setAddress] = useState(FALLBACK_BTC_ADDRESS);
  useEffect(() => {
    let cancelled = false;
    void getSetting("btc_address").then((value) => { if (!cancelled && value) setAddress(value); });
    return () => { cancelled = true; };
  }, []);
  return address;
}
