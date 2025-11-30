-- Function to update winner stats securely (bypassing RLS)
CREATE OR REPLACE FUNCTION update_winner_stats(
  p_user_id UUID,
  p_payout INTEGER,
  p_xp_gain INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator (postgres)
AS $$
DECLARE
  v_current_balance INTEGER;
  v_current_won INTEGER;
  v_current_bets_won INTEGER;
  v_current_total_bets INTEGER;
  v_current_xp INTEGER;
  v_new_level INTEGER;
  v_new_win_rate INTEGER;
BEGIN
  -- Get current stats
  SELECT balance, total_won, bets_won, total_bets, xp
  INTO v_current_balance, v_current_won, v_current_bets_won, v_current_total_bets, v_current_xp
  FROM public.profiles
  WHERE id = p_user_id;

  -- Calculate new values
  v_current_bets_won := COALESCE(v_current_bets_won, 0) + 1;
  v_current_won := COALESCE(v_current_won, 0) + p_payout;
  v_current_xp := COALESCE(v_current_xp, 0) + p_xp_gain;
  v_new_level := FLOOR(v_current_xp / 1000) + 1;
  
  -- Calculate win rate
  IF v_current_total_bets > 0 THEN
    v_new_win_rate := ROUND((v_current_bets_won::DECIMAL / v_current_total_bets::DECIMAL) * 100);
  ELSE
    v_new_win_rate := 100;
  END IF;

  -- Update profile
  UPDATE public.profiles
  SET 
    balance = v_current_balance + p_payout,
    total_won = v_current_won,
    bets_won = v_current_bets_won,
    win_rate = LEAST(v_new_win_rate, 100),
    xp = v_current_xp,
    level = v_new_level
  WHERE id = p_user_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_winner_stats(UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION update_winner_stats(UUID, INTEGER, INTEGER) TO service_role;

