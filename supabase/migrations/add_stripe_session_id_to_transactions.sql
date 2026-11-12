-- =============================================
-- STRIPE IDEMPOTENCY
-- Run BEFORE deploying the webhook that writes stripe_session_id.
-- (Old code ignores the column, so running it first is safe.)
-- =============================================
-- Why: Stripe can deliver the same checkout.session.completed event more than
-- once. The webhook now inserts a transactions row with the session id first;
-- the UNIQUE constraint makes any repeat a no-op instead of a second credit.

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS transactions_stripe_session_id_key
  ON public.transactions (stripe_session_id);

-- CHECK (run after, expect 1 row)
-- SELECT indexname FROM pg_indexes
--  WHERE tablename = 'transactions' AND indexname = 'transactions_stripe_session_id_key';
