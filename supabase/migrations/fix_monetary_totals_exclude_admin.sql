-- Fix: Exclude admin balances from total supply calculation
-- Admin balances skew the data and shouldn't be counted as circulating supply

CREATE OR REPLACE FUNCTION public.get_monetary_totals()
RETURNS TABLE (
  total_supply BIGINT,
  total_burned_fees BIGINT,
  total_burned_shop BIGINT,
  total_burned BIGINT,
  admin_balance BIGINT,
  player_count BIGINT,
  avg_balance BIGINT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    -- Total supply: only count non-admin players
    COALESCE((SELECT SUM(p.balance)::BIGINT FROM public.profiles p WHERE p.role IS DISTINCT FROM 'admin'), 0) AS total_supply,
    -- Burned fees from bets
    COALESCE((
      SELECT SUM(
        COALESCE(
          b.fee_paid::BIGINT,
          ROUND((b.amount::NUMERIC) * COALESCE(b.fee_rate, 0.05))::BIGINT
        )
      )::BIGINT
      FROM public.bets b
      WHERE b.status <> 'cancelled'
    ), 0) AS total_burned_fees,
    -- Burned from shop purchases
    COALESCE((
      SELECT SUM(o.price_paid)::BIGINT
      FROM public.orders o
      WHERE o.status <> 'cancelled'
    ), 0) AS total_burned_shop,
    -- Total burned (fees + shop)
    (
      COALESCE((
        SELECT SUM(
          COALESCE(
            b.fee_paid::BIGINT,
            ROUND((b.amount::NUMERIC) * COALESCE(b.fee_rate, 0.05))::BIGINT
          )
        )::BIGINT
        FROM public.bets b
        WHERE b.status <> 'cancelled'
      ), 0)
      +
      COALESCE((
        SELECT SUM(o.price_paid)::BIGINT
        FROM public.orders o
        WHERE o.status <> 'cancelled'
      ), 0)
    ) AS total_burned,
    -- Admin balance (excluded from supply, shown separately)
    COALESCE((SELECT SUM(p.balance)::BIGINT FROM public.profiles p WHERE p.role = 'admin'), 0) AS admin_balance,
    -- Player count (non-admin)
    COALESCE((SELECT COUNT(*)::BIGINT FROM public.profiles p WHERE p.role IS DISTINCT FROM 'admin'), 0) AS player_count,
    -- Average balance per player
    COALESCE((SELECT AVG(p.balance)::BIGINT FROM public.profiles p WHERE p.role IS DISTINCT FROM 'admin'), 0) AS avg_balance
  WHERE EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  );
$$;

