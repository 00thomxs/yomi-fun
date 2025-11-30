CREATE OR REPLACE FUNCTION update_winner_stats(
  p_user_id UUID,
  p_payout INTEGER,
  p_xp_gain INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance INTEGER;
  v_current_pnl INTEGER;
  v_current_bets_won INTEGER;
  v_current_total_bets INTEGER;
  v_current_streak INTEGER;
  v_current_xp INTEGER;
  v_new_level INTEGER;
  v_new_win_rate INTEGER;
BEGIN
  -- Get current stats
  SELECT 
    COALESCE(balance, 10000), 
    COALESCE(total_won, 0), 
    COALESCE(bets_won, 0), 
    COALESCE(total_bets, 0), 
    COALESCE(streak, 0),
    COALESCE(xp, 0)
  INTO 
    v_current_balance, 
    v_current_pnl, 
    v_current_bets_won, 
    v_current_total_bets, 
    v_current_streak, 
    v_current_xp
  FROM public.profiles
  WHERE id = p_user_id;

  -- Update values
  v_current_bets_won := v_current_bets_won + 1;
  v_current_streak := v_current_streak + 1; -- Increment Streak
  v_current_pnl := v_current_pnl + p_payout; -- Add Payout to PnL (which was decremented by wager)
  v_current_xp := v_current_xp + p_xp_gain;
  v_new_level := FLOOR(v_current_xp / 1000) + 1;
  
  -- Calculate win rate
  v_current_total_bets := GREATEST(v_current_total_bets, v_current_bets_won);
  
  IF v_current_total_bets > 0 THEN
    v_new_win_rate := ROUND((v_current_bets_won::DECIMAL / v_current_total_bets::DECIMAL) * 100);
  ELSE
    v_new_win_rate := 100;
  END IF;

  -- Update profile
  UPDATE public.profiles
  SET 
    balance = v_current_balance + p_payout,
    total_won = v_current_pnl,
    bets_won = v_current_bets_won,
    streak = v_current_streak,
    win_rate = LEAST(v_new_win_rate, 100),
    xp = v_current_xp,
    level = v_new_level
  WHERE id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION update_winner_stats(UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION update_winner_stats(UUID, INTEGER, INTEGER) TO service_role;
