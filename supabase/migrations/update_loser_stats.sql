CREATE OR REPLACE FUNCTION update_loser_stats(
  p_user_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_real_bets_won INTEGER;
  v_real_total_bets INTEGER;
  v_new_win_rate INTEGER;
BEGIN
  -- Reset Streak
  UPDATE public.profiles SET streak = 0 WHERE id = p_user_id;

  -- Recalculate Win Rate
  SELECT total_bets, bets_won INTO v_real_total_bets, v_real_bets_won 
  FROM public.profiles WHERE id = p_user_id;
  
  -- total_bets includes the current lost bet (incremented at placeBet).
  -- bets_won does not change.
  
  IF v_real_total_bets > 0 THEN
    v_new_win_rate := ROUND((v_real_bets_won::DECIMAL / v_real_total_bets::DECIMAL) * 100);
  ELSE
    v_new_win_rate := 0;
  END IF;

  -- Update Win Rate
  UPDATE public.profiles
  SET win_rate = LEAST(v_new_win_rate, 100)
  WHERE id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION update_loser_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_loser_stats(UUID) TO service_role;

