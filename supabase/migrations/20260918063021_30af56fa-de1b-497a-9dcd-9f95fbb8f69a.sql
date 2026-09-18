ALTER TABLE public.transactions
ADD COLUMN withdrawal_progress integer NOT NULL DEFAULT 0;

ALTER TABLE public.transactions
ADD CONSTRAINT transactions_withdrawal_progress_range
CHECK (withdrawal_progress >= 0 AND withdrawal_progress <= 100);

CREATE OR REPLACE FUNCTION public.sync_withdrawal_progress_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.type = 'withdrawal' THEN
    IF NEW.withdrawal_progress >= 100 THEN
      NEW.withdrawal_progress := 100;
      NEW.status := 'completed';
    ELSIF NEW.status = 'completed' THEN
      NEW.withdrawal_progress := 100;
    ELSE
      NEW.status := 'pending';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER sync_withdrawal_progress_status_trigger
BEFORE INSERT OR UPDATE OF withdrawal_progress, status ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.sync_withdrawal_progress_status();

UPDATE public.transactions
SET withdrawal_progress = CASE WHEN type = 'withdrawal' AND status = 'completed' THEN 100 ELSE withdrawal_progress END
WHERE type = 'withdrawal';