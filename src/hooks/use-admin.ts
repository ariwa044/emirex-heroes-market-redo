import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/** True when the signed-in user holds the admin role. */
export function useIsAdmin(userId: string | undefined): boolean {
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    if (!userId) { setIsAdmin(false); return; }
    let cancelled = false;
    void supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => { if (!cancelled) setIsAdmin(Boolean(data)); });
    return () => { cancelled = true; };
  }, [userId]);
  return isAdmin;
}
