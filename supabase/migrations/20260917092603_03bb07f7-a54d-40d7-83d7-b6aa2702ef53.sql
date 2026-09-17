
CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('deposit','withdrawal')),
  amount numeric(20,2) NOT NULL CHECK (amount > 0),
  method text NOT NULL DEFAULT 'bank_transfer',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','rejected')),
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own transactions" ON public.transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own transactions" ON public.transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER transactions_set_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX transactions_user_idx ON public.transactions (user_id, created_at DESC);

CREATE TABLE public.investment_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  min_amount numeric(20,2) NOT NULL,
  max_amount numeric(20,2),
  roi_percent numeric(6,2) NOT NULL,
  duration_days integer NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.investment_plans TO anon, authenticated;
GRANT ALL ON public.investment_plans TO service_role;
ALTER TABLE public.investment_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Plans are publicly readable" ON public.investment_plans FOR SELECT TO anon, authenticated USING (true);
CREATE TRIGGER investment_plans_set_updated_at BEFORE UPDATE ON public.investment_plans FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.investments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.investment_plans(id),
  amount numeric(20,2) NOT NULL CHECK (amount > 0),
  expected_return numeric(20,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','cancelled')),
  started_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.investments TO authenticated;
GRANT ALL ON public.investments TO service_role;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own investments" ON public.investments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own investments" ON public.investments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own investments" ON public.investments FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER investments_set_updated_at BEFORE UPDATE ON public.investments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX investments_user_idx ON public.investments (user_id, created_at DESC);

INSERT INTO public.investment_plans (name, description, min_amount, max_amount, roi_percent, duration_days, sort_order) VALUES
 ('Starter', 'Entry desk allocation for first-time investors.', 100, 999, 8.00, 7, 1),
 ('Silver', 'Balanced multi-asset allocation with weekly payouts.', 1000, 4999, 15.00, 14, 2),
 ('Gold', 'Active desk strategy across FX and crypto.', 5000, 24999, 26.00, 30, 3),
 ('Elite', 'Institutional allocation with a dedicated strategist.', 25000, NULL, 42.00, 60, 4);
