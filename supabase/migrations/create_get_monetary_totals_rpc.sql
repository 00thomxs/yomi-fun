-- RPC: compute key monetary totals using SQL aggregates (fast & scalable)
-- Returns totals for admin dashboard without scanning rows client-side.

CREATE OR REPLACE FUNCTION public.get_monetary_totals()
RETURNS TABLE (
  total_supply BIGINT,
  total_burned_fees BIGINT,
  total_burned_shop BIGINT,
  total_burned BIGINT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    COALESCE((SELECT SUM(p.balance)::BIGINT FROM public.profiles p), 0) AS total_supply,
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
    COALESCE((
      SELECT SUM(o.price_paid)::BIGINT
      FROM public.orders o
      WHERE o.status <> 'cancelled'
    ), 0) AS total_burned_shop,
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
    ) AS total_burned
  WHERE EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  );
$$;


