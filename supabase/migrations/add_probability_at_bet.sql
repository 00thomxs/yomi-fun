-- Add probability_at_bet column to bets table for special badges (DIEU, RISK TAKER, ALL IN)
-- This stores the probability of the outcome at the time the bet was placed

ALTER TABLE public.bets
ADD COLUMN IF NOT EXISTS probability_at_bet DECIMAL(5,4);

-- Also add user_balance_before to track ALL IN bets
ALTER TABLE public.bets
ADD COLUMN IF NOT EXISTS user_balance_before BIGINT;

COMMENT ON COLUMN public.bets.probability_at_bet IS 'Probability of the chosen outcome when bet was placed (0.0 to 1.0)';
COMMENT ON COLUMN public.bets.user_balance_before IS 'User balance before placing the bet, used for ALL IN badge detection';

