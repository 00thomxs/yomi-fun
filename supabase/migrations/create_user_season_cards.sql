-- =====================================================
-- USER SEASON CARDS - Profile Cards System
-- =====================================================
-- Stores the highest card tier achieved by each user per season
-- Tiers: iron, bronze, gold, diamond, holographic

-- Create table
CREATE TABLE IF NOT EXISTS public.user_season_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  season_id UUID NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('iron', 'bronze', 'gold', 'diamond', 'holographic')),
  highest_tier_achieved TEXT NOT NULL CHECK (highest_tier_achieved IN ('iron', 'bronze', 'gold', 'diamond', 'holographic')),
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, season_id)
);

-- Create indexes
CREATE INDEX idx_user_season_cards_user ON public.user_season_cards(user_id);
CREATE INDEX idx_user_season_cards_season ON public.user_season_cards(season_id);

-- Enable RLS
ALTER TABLE public.user_season_cards ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own cards
CREATE POLICY "Users can view own cards"
  ON public.user_season_cards
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can view others' cards (for display purposes)
CREATE POLICY "Anyone can view cards"
  ON public.user_season_cards
  FOR SELECT
  USING (true);

-- Only system/admin can insert/update
CREATE POLICY "System can manage cards"
  ON public.user_season_cards
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Function to calculate card tier based on season stats
CREATE OR REPLACE FUNCTION calculate_card_tier(
  p_user_id UUID,
  p_season_id UUID
) RETURNS TEXT AS $$
DECLARE
  v_season_pnl BIGINT;
  v_season_rank INT;
  v_tier TEXT;
BEGIN
  -- Get user's season leaderboard entry
  SELECT points, 
         ROW_NUMBER() OVER (ORDER BY points DESC)
  INTO v_season_pnl, v_season_rank
  FROM public.season_leaderboards
  WHERE season_id = p_season_id AND user_id = p_user_id;
  
  -- If user not in season leaderboard, return iron
  IF v_season_pnl IS NULL THEN
    RETURN 'iron';
  END IF;
  
  -- Determine tier based on rank first (for diamond/holo)
  IF v_season_rank <= 3 THEN
    RETURN 'holographic';
  ELSIF v_season_rank <= 10 THEN
    RETURN 'diamond';
  END IF;
  
  -- Then based on PnL thresholds
  IF v_season_pnl >= 25000 THEN
    RETURN 'gold';
  ELSIF v_season_pnl >= 10000 THEN
    RETURN 'bronze';
  ELSE
    RETURN 'iron';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user's card tier
CREATE OR REPLACE FUNCTION update_user_card_tier(
  p_user_id UUID,
  p_season_id UUID
) RETURNS TABLE(
  tier TEXT,
  highest_tier TEXT,
  is_new_tier BOOLEAN
) AS $$
DECLARE
  v_current_tier TEXT;
  v_existing_highest TEXT;
  v_new_highest TEXT;
  v_is_new BOOLEAN := FALSE;
  v_tier_order TEXT[] := ARRAY['iron', 'bronze', 'gold', 'diamond', 'holographic'];
BEGIN
  -- Calculate current tier
  v_current_tier := calculate_card_tier(p_user_id, p_season_id);
  
  -- Get existing highest tier
  SELECT usc.highest_tier_achieved INTO v_existing_highest
  FROM public.user_season_cards usc
  WHERE usc.user_id = p_user_id AND usc.season_id = p_season_id;
  
  -- Determine if this is a new/higher tier
  IF v_existing_highest IS NULL THEN
    v_new_highest := v_current_tier;
    v_is_new := TRUE;
  ELSE
    -- Compare tiers
    IF array_position(v_tier_order, v_current_tier) > array_position(v_tier_order, v_existing_highest) THEN
      v_new_highest := v_current_tier;
      v_is_new := TRUE;
    ELSE
      v_new_highest := v_existing_highest;
    END IF;
  END IF;
  
  -- Upsert the card
  INSERT INTO public.user_season_cards (user_id, season_id, tier, highest_tier_achieved)
  VALUES (p_user_id, p_season_id, v_current_tier, v_new_highest)
  ON CONFLICT (user_id, season_id) DO UPDATE SET
    tier = v_current_tier,
    highest_tier_achieved = CASE 
      WHEN array_position(v_tier_order, v_current_tier) > array_position(v_tier_order, user_season_cards.highest_tier_achieved)
      THEN v_current_tier
      ELSE user_season_cards.highest_tier_achieved
    END,
    updated_at = NOW();
  
  RETURN QUERY SELECT v_current_tier, v_new_highest, v_is_new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC to get user's card for a season
CREATE OR REPLACE FUNCTION get_user_season_card(
  p_user_id UUID,
  p_season_id UUID
) RETURNS TABLE(
  tier TEXT,
  highest_tier_achieved TEXT,
  season_name TEXT,
  season_number INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(usc.tier, 'iron'),
    COALESCE(usc.highest_tier_achieved, 'iron'),
    s.name,
    COALESCE(
      (SELECT COUNT(*)::INT FROM public.seasons WHERE created_at <= s.created_at),
      0
    )
  FROM public.seasons s
  LEFT JOIN public.user_season_cards usc 
    ON usc.season_id = s.id AND usc.user_id = p_user_id
  WHERE s.id = p_season_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

