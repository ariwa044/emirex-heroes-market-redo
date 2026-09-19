import { AlertCircle, RadioTower } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AccountLock({ reason = "upgrade", onDismiss }: { reason?: "upgrade" | "hold"; onDismiss?: () => void }) {
  const onHold = reason === "hold";
  const Icon = onHold ? RadioTower : AlertCircle;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/95 p-4 backdrop-blur-sm" role="alertdialog" aria-modal="true" aria-label={onHold ? "Account on hold" : "Account upgrade required"}>
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center">
        <Icon className="mx-auto size-16 text-signal" strokeWidth={1.5} />
        <h2 className="mt-6 font-head text-3xl font-semibold">{onHold ? "Account on hold" : "Warning"}</h2>
        <p className="mt-4 text-base text-muted-foreground">
          {onHold
            ? "Your account is currently out of signal reach and cannot be used. Please contact customer support for assistance."
            : "Please upgrade your account, your current investment plan does not support this action!"}
        </p>
        <p className="mt-6 text-xs uppercase tracking-[0.18em] text-signal">{onHold ? "Access returns once support lifts the hold" : "Contact customer support to continue"}</p>
        {onDismiss && <Button variant="ghost" className="mt-6" onClick={onDismiss}>Continue as administrator</Button>}
      </div>
    </div>
  );
}
