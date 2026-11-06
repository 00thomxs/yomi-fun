-- Fix get_top_players_by_pnl: the 'all' branch returned profiles.total_won (integer)
-- into a bigint column -> 42804, admin "Top 50 PnL" table stayed empty.
-- Only change: p.total_won::BIGINT. Also locks the RPC to service_role (only the admin
-- server action calls it, via supabaseAdmin), like lock_down_profiles_and_rpcs.sql.

CREATE OR REPLACE FUNCTION public.get_top_players_by_pnl(
  p_timeframe TEXT DEFAULT 'all', -- 'day', 'week', 'month', 'all'
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE(
  id UUID,
  username TEXT,
  avatar_url TEXT,
  total_won BIGINT,
  balance BIGINT,
  win_rate NUMERIC,
  total_bets INTEGER,
  is_banned BOOLEAN
) AS $$
BEGIN
  IF p_timeframe = 'all' THEN
    RETURN QUERY
    SELECT
      p.id,
      p.username,
      p.avatar_url,
      p.total_won::BIGINT,
      p.balance,
      p.win_rate,
      p.total_bets,
      COALESCE(p.is_banned, false)
    FROM public.profiles p
    WHERE p.role != 'admin' OR p.role IS NULL
    ORDER BY p.total_won DESC
    LIMIT p_limit;
  ELSE
    RETURN QUERY
    WITH timeframe_pnl AS (
      SELECT
        b.user_id,
        SUM(CASE
          WHEN b.status = 'won' THEN b.potential_payout - b.amount
          WHEN b.status = 'lost' THEN -b.amount
          ELSE 0
        END) as period_pnl
      FROM public.bets b
      WHERE b.created_at >= CASE p_timeframe
        WHEN 'day' THEN CURRENT_DATE
        WHEN 'week' THEN CURRENT_DATE - INTERVAL '7 days'
        WHEN 'month' THEN CURRENT_DATE - INTERVAL '30 days'
        ELSE '1970-01-01'::DATE
      END
      AND b.status IN ('won', 'lost')
      GROUP BY b.user_id
    )
    SELECT
      p.id,
      p.username,
      p.avatar_url,
      COALESCE(t.period_pnl, 0)::BIGINT as total_won,
      p.balance,
      p.win_rate,
      p.total_bets,
      COALESCE(p.is_banned, false)
    FROM public.profiles p
    LEFT JOIN timeframe_pnl t ON t.user_id = p.id
    WHERE p.role != 'admin' OR p.role IS NULL
    ORDER BY COALESCE(t.period_pnl, 0) DESC
    LIMIT p_limit;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE EXECUTE ON FUNCTION public.get_top_players_by_pnl(TEXT, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_top_players_by_pnl(TEXT, INTEGER) TO service_role;
