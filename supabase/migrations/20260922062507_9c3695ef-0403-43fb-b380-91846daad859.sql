ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS manual_profit numeric,
  ADD COLUMN IF NOT EXISTS manual_withdrawals numeric,
  ADD COLUMN IF NOT EXISTS manual_bitcoin numeric;