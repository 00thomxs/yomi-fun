-- Function to get PnL history for a user
-- Supports daily grouping for > 1 day, and hourly for <= 1 day (approx)
-- Actually, let's stick to daily for MVP to ensure stability, 
-- but allow smaller interval if needed in future.

CREATE OR REPLACE FUNCTION get_pnl_history(
  p_user_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  date TIMESTAMP WITH TIME ZONE,
  daily_pnl BIGINT,
  cumulative_pnl BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH daily_stats AS (
    SELECT
      date_trunc('day', resolved_at) as stats_date,
      SUM(
        CASE 
          WHEN status = 'won' THEN (potential_payout - amount)
          WHEN status = 'lost' THEN -amount
          ELSE 0
        END
      ) as day_pnl
    FROM
      bets
    WHERE
      user_id = p_user_id
      AND status IN ('won', 'lost')
      AND resolved_at >= NOW() - (p_days || ' days')::INTERVAL
    GROUP BY
      date_trunc('day', resolved_at)
  ),
  date_series AS (
    SELECT generate_series(
      date_trunc('day', NOW() - (p_days || ' days')::INTERVAL),
      date_trunc('day', NOW()),
      '1 day'::INTERVAL
    ) as series_date
  )
  SELECT
    ds.series_date as date,
    COALESCE(dst.day_pnl, 0) as daily_pnl,
    SUM(COALESCE(dst.day_pnl, 0)) OVER (ORDER BY ds.series_date ASC) as cumulative_pnl
  FROM
    date_series ds
  LEFT JOIN
    daily_stats dst ON ds.series_date = dst.stats_date
  ORDER BY
    ds.series_date ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_pnl_history(UUID, INTEGER) TO authenticated;
