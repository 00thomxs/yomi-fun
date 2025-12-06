CREATE OR REPLACE FUNCTION update_winner_stats(
  p_user_id UUID,
  p_payout INTEGER,
  p_bet_amount INTEGER,
  p_xp_gain INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance INTEGER;
  v_current_pnl INTEGER;
  v_real_bets_won INTEGER;
  v_real_bets_lost INTEGER;
  v_current_streak INTEGER;
  v_current_xp INTEGER;
  v_new_level INTEGER;
  v_new_win_rate INTEGER;
BEGIN
  -- Get current stats
  SELECT 
    COALESCE(balance, 0), 
    COALESCE(total_won, 0), 
    COALESCE(streak, 0),
    COALESCE(xp, 0)
  INTO 
    v_current_balance, 
    v_current_pnl, 
    v_current_streak, 
    v_current_xp
  FROM public.profiles
  WHERE id = p_user_id;

  -- Recalculate Win/Loss counts from bets table
  SELECT 
    COUNT(*) FILTER (WHERE status = 'won'),
    COUNT(*) FILTER (WHERE status = 'lost')
  INTO 
    v_real_bets_won, 
    v_real_bets_lost
  FROM public.bets
  WHERE user_id = p_user_id;

  -- Add current win
  v_real_bets_won := v_real_bets_won + 1;

  -- Update values
  v_current_streak := v_current_streak + 1;
  
  -- Update PnL (Net Profit = Payout - Initial Bet)
  -- Note: If Payout < Bet (possible in some parimutuel), PnL decreases.
  v_current_pnl := v_current_pnl + (p_payout - p_bet_amount);
  
  v_current_xp := v_current_xp + p_xp_gain;
  v_new_level := FLOOR(v_current_xp / 1000) + 1;
  
  -- Calculate Win Rate
  IF (v_real_bets_won + v_real_bets_lost) > 0 THEN
    v_new_win_rate := ROUND((v_real_bets_won::DECIMAL / (v_real_bets_won + v_real_bets_lost)::DECIMAL) * 100);
  ELSE
    v_new_win_rate := 0;
  END IF;

  -- Update profile
  UPDATE public.profiles
  SET 
    balance = v_current_balance + p_payout,
    total_won = v_current_pnl,
    bets_won = v_real_bets_won,
    streak = v_current_streak,
    win_rate = LEAST(v_new_win_rate, 100),
    xp = v_current_xp,
    level = v_new_level
  WHERE id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION update_winner_stats(UUID, INTEGER, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION update_winner_stats(UUID, INTEGER, INTEGER, INTEGER) TO service_role;
