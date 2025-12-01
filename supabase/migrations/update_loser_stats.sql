CREATE OR REPLACE FUNCTION update_loser_stats(
  p_user_id UUID,
  p_bet_amount INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_real_bets_won INTEGER;
  v_real_bets_lost INTEGER;
  v_new_win_rate INTEGER;
  v_current_pnl INTEGER;
BEGIN
  -- Get current PnL
  SELECT COALESCE(total_won, 0) INTO v_current_pnl FROM public.profiles WHERE id = p_user_id;

  -- Update PnL (Net Loss = - Bet Amount)
  v_current_pnl := v_current_pnl - p_bet_amount;

  -- Reset Streak and Update PnL
  UPDATE public.profiles 
  SET 
    streak = 0,
    total_won = v_current_pnl
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
  
  -- Add current loss (manually because it's not yet in DB status 'lost' usually)
  v_real_bets_lost := v_real_bets_lost + 1;
  
  IF (v_real_bets_won + v_real_bets_lost) > 0 THEN
    v_new_win_rate := ROUND((v_real_bets_won::DECIMAL / (v_real_bets_won + v_real_bets_lost)::DECIMAL) * 100);
  ELSE
    v_new_win_rate := 0;
  END IF;

  -- Update Win Rate
  UPDATE public.profiles
  SET 
    win_rate = LEAST(v_new_win_rate, 100),
    bets_won = v_real_bets_won
  WHERE id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION update_loser_stats(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION update_loser_stats(UUID, INTEGER) TO service_role;
