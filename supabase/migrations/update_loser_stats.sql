CREATE OR REPLACE FUNCTION update_loser_stats(
  p_user_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_real_bets_won INTEGER;
  v_real_bets_lost INTEGER;
  v_new_win_rate INTEGER;
BEGIN
  -- Reset Streak
  UPDATE public.profiles SET streak = 0 WHERE id = p_user_id;

  -- Recalculate Win/Loss counts from bets table
  SELECT 
    COUNT(*) FILTER (WHERE status = 'won'),
    COUNT(*) FILTER (WHERE status = 'lost')
  INTO 
    v_real_bets_won, 
    v_real_bets_lost
  FROM public.bets
  WHERE user_id = p_user_id;
  
  -- Current lost bet is NOT YET marked as 'lost' in DB when this runs (usually).
  -- Or is it? In resolveMarket, we call RPC *before* update status? No, wait.
  -- In resolveMarket code for loser:
  -- 1. RPC update_loser_stats
  -- 2. Update bet status to 'lost'
  -- So the current loss is NOT in DB yet. We must add +1 manually.
  
  v_real_bets_lost := v_real_bets_lost + 1;
  
  IF (v_real_bets_won + v_real_bets_lost) > 0 THEN
    v_new_win_rate := ROUND((v_real_bets_won::DECIMAL / (v_real_bets_won + v_real_bets_lost)::DECIMAL) * 100);
  ELSE
    v_new_win_rate := 0;
  END IF;

  -- Update Win Rate and ensure bets_won is synced
  UPDATE public.profiles
  SET 
    win_rate = LEAST(v_new_win_rate, 100),
    bets_won = v_real_bets_won -- Sync bets_won count just in case
  WHERE id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION update_loser_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_loser_stats(UUID) TO service_role;
