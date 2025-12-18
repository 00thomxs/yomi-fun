-- =====================================================
-- Add 'beta' tier to user_season_cards constraints
-- =====================================================
-- The beta tier was missing from the CHECK constraints,
-- causing insert failures when awarding beta tester cards.

-- Drop existing constraints
ALTER TABLE public.user_season_cards 
  DROP CONSTRAINT IF EXISTS user_season_cards_tier_check;

ALTER TABLE public.user_season_cards 
  DROP CONSTRAINT IF EXISTS user_season_cards_highest_tier_achieved_check;

-- Add new constraints with 'beta' included
ALTER TABLE public.user_season_cards 
  ADD CONSTRAINT user_season_cards_tier_check 
  CHECK (tier IN ('iron', 'bronze', 'gold', 'diamond', 'holographic', 'beta'));

ALTER TABLE public.user_season_cards 
  ADD CONSTRAINT user_season_cards_highest_tier_achieved_check 
  CHECK (highest_tier_achieved IN ('iron', 'bronze', 'gold', 'diamond', 'holographic', 'beta'));

