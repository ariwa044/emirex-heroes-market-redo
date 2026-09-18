import { AlertCircle } from "lucide-react";

export function AccountLock() {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/90 p-4 backdrop-blur-sm" role="alertdialog" aria-modal="true" aria-label="Account upgrade required">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center">
        <AlertCircle className="mx-auto size-16 text-signal" strokeWidth={1.5} />
        <h2 className="mt-6 font-head text-3xl font-semibold">Warning</h2>
        <p className="mt-4 text-base text-muted-foreground">
          Please upgrade your account, your current investment plan does not support this action!
        </p>
        <p className="mt-6 text-xs uppercase tracking-[0.18em] text-signal">Contact customer support to continue</p>
      </div>
    </div>
  );
}
