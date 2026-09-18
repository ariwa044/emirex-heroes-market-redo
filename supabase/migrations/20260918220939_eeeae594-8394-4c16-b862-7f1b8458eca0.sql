ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS account_on_hold boolean NOT NULL DEFAULT false;