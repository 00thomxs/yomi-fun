-- =====================================================
-- USER BAN SYSTEM - Admin moderation tools
-- =====================================================

-- Add ban columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS ban_reason TEXT;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS banned_by UUID REFERENCES public.profiles(id);

-- Index for quick banned user lookups
CREATE INDEX IF NOT EXISTS idx_profiles_banned ON public.profiles(is_banned) WHERE is_banned = true;

-- Function to check if user is banned (for use in auth flow)
CREATE OR REPLACE FUNCTION public.is_user_banned(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = p_user_id AND is_banned = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC to get platform stats for admin dashboard
CREATE OR REPLACE FUNCTION public.get_admin_platform_stats()
RETURNS JSONB AS $$
DECLARE
  v_total_users INTEGER;
  v_active_today INTEGER;
  v_new_today INTEGER;
  v_new_week INTEGER;
  v_new_month INTEGER;
  v_banned_users INTEGER;
  v_volume_today BIGINT;
  v_total_volume BIGINT;
  v_total_distributed BIGINT;
BEGIN
  -- Total users
  SELECT COUNT(*) INTO v_total_users FROM public.profiles;
  
  -- Active today (placed a bet today)
  SELECT COUNT(DISTINCT user_id) INTO v_active_today
  FROM public.bets
  WHERE created_at >= CURRENT_DATE;
  
  -- New users today
  SELECT COUNT(*) INTO v_new_today
  FROM public.profiles
  WHERE created_at >= CURRENT_DATE;
  
  -- New users this week
  SELECT COUNT(*) INTO v_new_week
  FROM public.profiles
  WHERE created_at >= CURRENT_DATE - INTERVAL '7 days';
  
  -- New users this month
  SELECT COUNT(*) INTO v_new_month
  FROM public.profiles
  WHERE created_at >= CURRENT_DATE - INTERVAL '30 days';
  
  -- Banned users
  SELECT COUNT(*) INTO v_banned_users
  FROM public.profiles
  WHERE is_banned = true;
  
  -- Volume today (sum of bet amounts)
  SELECT COALESCE(SUM(amount), 0) INTO v_volume_today
  FROM public.bets
  WHERE created_at >= CURRENT_DATE;
  
  -- Total volume all time
  SELECT COALESCE(SUM(amount), 0) INTO v_total_volume
  FROM public.bets;
  
  -- Total distributed (sum of positive total_won)
  SELECT COALESCE(SUM(total_won), 0) INTO v_total_distributed
  FROM public.profiles
  WHERE total_won > 0;
  
  RETURN jsonb_build_object(
    'totalUsers', v_total_users,
    'activeToday', v_active_today,
    'newToday', v_new_today,
    'newWeek', v_new_week,
    'newMonth', v_new_month,
    'bannedUsers', v_banned_users,
    'volumeToday', v_volume_today,
    'totalVolume', v_total_volume,
    'totalDistributed', v_total_distributed
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC to get top players by PNL with timeframe
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
      p.total_won,
      p.balance,
      p.win_rate,
      p.total_bets,
      COALESCE(p.is_banned, false)
    FROM public.profiles p
    WHERE p.role != 'admin' OR p.role IS NULL
    ORDER BY p.total_won DESC
    LIMIT p_limit;
  ELSE
    -- For timeframe-specific, we need to calculate from bets
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.is_user_banned(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_platform_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_top_players_by_pnl(TEXT, INTEGER) TO authenticated;

