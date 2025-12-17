-- =============================================
-- BADGES SYSTEM: Gamification for YOMI.fun
-- =============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- CLEAN SLATE: Drop existing tables if they exist
-- (Safe to run multiple times)
-- =============================================
DROP TABLE IF EXISTS public.user_badges CASCADE;
DROP TABLE IF EXISTS public.badges CASCADE;

-- =============================================
-- TABLE 1: badges (Catalogue)
-- =============================================
CREATE TABLE public.badges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'streak', 'pnl', 'season', 'skill', 'legacy', 'fun'
  level INTEGER, -- 1, 2, 3, 4 for evolving badges (NULL for unique badges)
  icon_name TEXT NOT NULL, -- Lucide React icon name
  rarity TEXT DEFAULT 'common', -- 'common', 'rare', 'epic', 'legendary'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- =============================================
-- TABLE 2: user_badges (Inventaire)
-- =============================================
CREATE TABLE public.user_badges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  badge_id UUID REFERENCES public.badges(id) ON DELETE CASCADE NOT NULL,
  is_equipped BOOLEAN DEFAULT false NOT NULL,
  is_seen BOOLEAN DEFAULT false NOT NULL,
  obtained_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Each user can only have each badge once
  CONSTRAINT unique_user_badge UNIQUE (user_id, badge_id)
);

-- Index for fast lookups
CREATE INDEX idx_user_badges_user_id ON public.user_badges(user_id);
CREATE INDEX idx_user_badges_equipped ON public.user_badges(user_id, is_equipped) WHERE is_equipped = true;
CREATE INDEX idx_user_badges_unseen ON public.user_badges(user_id, is_seen) WHERE is_seen = false;

-- =============================================
-- RLS POLICIES
-- =============================================
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Badges catalog: everyone can read
CREATE POLICY "Badges are viewable by everyone"
  ON public.badges FOR SELECT
  USING (true);

-- User badges: users can see all badges (for leaderboard/profiles)
CREATE POLICY "User badges are viewable by everyone"
  ON public.user_badges FOR SELECT
  USING (true);

-- User badges: users can only update their own
CREATE POLICY "Users can update their own badges"
  ON public.user_badges FOR UPDATE
  USING (auth.uid() = user_id);

-- Only system (via SECURITY DEFINER functions) or admin can insert badges
-- Users should NOT be able to insert badges for themselves
CREATE POLICY "Only admin can insert user badges"
  ON public.user_badges FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- =============================================
-- FUNCTION: Check max 2 equipped badges
-- =============================================
CREATE OR REPLACE FUNCTION public.check_max_equipped_badges()
RETURNS TRIGGER AS $$
DECLARE
  equipped_count INTEGER;
BEGIN
  -- Only check if trying to equip (is_equipped = true)
  IF NEW.is_equipped = true THEN
    SELECT COUNT(*) INTO equipped_count
    FROM public.user_badges
    WHERE user_id = NEW.user_id 
      AND is_equipped = true
      AND id != NEW.id;
    
    IF equipped_count >= 2 THEN
      RAISE EXCEPTION 'Maximum 2 badges can be equipped at a time';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for max equipped check
DROP TRIGGER IF EXISTS check_equipped_badges_trigger ON public.user_badges;
CREATE TRIGGER check_equipped_badges_trigger
  BEFORE INSERT OR UPDATE ON public.user_badges
  FOR EACH ROW
  EXECUTE FUNCTION public.check_max_equipped_badges();

-- =============================================
-- FUNCTION: Award badge to user
-- =============================================
CREATE OR REPLACE FUNCTION public.award_badge(
  p_user_id UUID,
  p_badge_slug TEXT
)
RETURNS UUID AS $$
DECLARE
  v_badge_id UUID;
  v_user_badge_id UUID;
BEGIN
  -- Get badge ID from slug
  SELECT id INTO v_badge_id FROM public.badges WHERE slug = p_badge_slug;
  
  IF v_badge_id IS NULL THEN
    RAISE EXCEPTION 'Badge with slug % not found', p_badge_slug;
  END IF;
  
  -- Insert or ignore if already exists
  INSERT INTO public.user_badges (user_id, badge_id, is_equipped, is_seen)
  VALUES (p_user_id, v_badge_id, false, false)
  ON CONFLICT (user_id, badge_id) DO NOTHING
  RETURNING id INTO v_user_badge_id;
  
  RETURN v_user_badge_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- SEED DATA: All badges
-- =============================================

-- SÉRIE "DEVIN" (Win Streak) - Eye icon
INSERT INTO public.badges (slug, name, description, category, level, icon_name, rarity) VALUES
  ('devin-1', 'DEVIN I', '3 wins consécutives', 'streak', 1, 'Eye', 'common'),
  ('devin-2', 'DEVIN II', '5 wins consécutives', 'streak', 2, 'Eye', 'rare'),
  ('devin-3', 'DEVIN III', '10 wins consécutives', 'streak', 3, 'Eye', 'epic'),
  ('devin-4', 'DEVIN IV', '20 wins consécutives', 'streak', 4, 'Eye', 'legendary')
ON CONFLICT (slug) DO NOTHING;

-- SÉRIE "TRADER" (PnL Global) - TrendingUp icon
INSERT INTO public.badges (slug, name, description, category, level, icon_name, rarity) VALUES
  ('trader-1', 'TRADER I', '+10K PnL total', 'pnl', 1, 'TrendingUp', 'common'),
  ('trader-2', 'TRADER II', '+50K PnL total', 'pnl', 2, 'TrendingUp', 'rare'),
  ('trader-3', 'TRADER III', '+100K PnL total', 'pnl', 3, 'TrendingUp', 'epic'),
  ('trader-4', 'TRADER IV', '+1M PnL total', 'pnl', 4, 'TrendingUp', 'legendary')
ON CONFLICT (slug) DO NOTHING;

-- SÉRIE "CHAMPION" (Victoires Saison) - Trophy icon
INSERT INTO public.badges (slug, name, description, category, level, icon_name, rarity) VALUES
  ('champion-1', 'CHAMPION I', '1 victoire de saison', 'season', 1, 'Trophy', 'rare'),
  ('champion-2', 'CHAMPION II', '2 victoires de saison', 'season', 2, 'Trophy', 'epic'),
  ('champion-3', 'CHAMPION III', '3 victoires de saison', 'season', 3, 'Trophy', 'epic'),
  ('champion-4', 'CHAMPION IV', '4 victoires de saison', 'season', 4, 'Trophy', 'legendary')
ON CONFLICT (slug) DO NOTHING;

-- SÉRIE "PODIUM" (Podiums Saison) - Medal icon
INSERT INTO public.badges (slug, name, description, category, level, icon_name, rarity) VALUES
  ('podium-1', 'PODIUM I', '1 podium de saison', 'season', 1, 'Medal', 'common'),
  ('podium-2', 'PODIUM II', '2 podiums de saison', 'season', 2, 'Medal', 'rare'),
  ('podium-3', 'PODIUM III', '3 podiums de saison', 'season', 3, 'Medal', 'epic'),
  ('podium-4', 'PODIUM IV', '4 podiums de saison', 'season', 4, 'Medal', 'legendary')
ON CONFLICT (slug) DO NOTHING;

-- SÉRIE "WHALE" (Balance) - Diamond icon
INSERT INTO public.badges (slug, name, description, category, level, icon_name, rarity) VALUES
  ('whale-1', 'WHALE I', '25K balance atteinte', 'pnl', 1, 'Diamond', 'common'),
  ('whale-2', 'WHALE II', '50K balance atteinte', 'pnl', 2, 'Diamond', 'rare'),
  ('whale-3', 'WHALE III', '100K balance atteinte', 'pnl', 3, 'Diamond', 'epic'),
  ('whale-4', 'WHALE IV', '1M balance atteinte', 'pnl', 4, 'Diamond', 'legendary')
ON CONFLICT (slug) DO NOTHING;

-- SÉRIE "SENSEI" (Volume Paris) - Swords icon
INSERT INTO public.badges (slug, name, description, category, level, icon_name, rarity) VALUES
  ('sensei-1', 'SENSEI I', '10 paris placés', 'volume', 1, 'Swords', 'common'),
  ('sensei-2', 'SENSEI II', '25 paris placés', 'volume', 2, 'Swords', 'rare'),
  ('sensei-3', 'SENSEI III', '50 paris placés', 'volume', 3, 'Swords', 'epic'),
  ('sensei-4', 'SENSEI IV', '100 paris placés', 'volume', 4, 'Swords', 'legendary')
ON CONFLICT (slug) DO NOTHING;

-- BADGES UNIQUES - SKILL (Season Win Rate, requires 50%+ events participation)
INSERT INTO public.badges (slug, name, description, category, level, icon_name, rarity) VALUES
  ('cheat-code', 'CHEAT CODE', '100% Win Rate saison (50%+ events)', 'skill', NULL, 'Gamepad2', 'legendary'),
  ('aim-bot', 'AIM BOT', '>80% Win Rate saison (50%+ events)', 'skill', NULL, 'Crosshair', 'epic'),
  ('smart-money', 'SMART MONEY', '>60% Win Rate saison (50%+ events)', 'skill', NULL, 'Brain', 'rare')
ON CONFLICT (slug) DO NOTHING;

-- BADGES UNIQUES - LEGACY
INSERT INTO public.badges (slug, name, description, category, level, icon_name, rarity) VALUES
  ('goat', 'G.O.A.T', 'Top 1 Global All-Time', 'legacy', NULL, 'Crown', 'legendary'),
  ('mvp', 'MVP', 'Top 3 Global All-Time', 'legacy', NULL, 'Award', 'epic')
ON CONFLICT (slug) DO NOTHING;

-- BADGES UNIQUES - FUN / RISK
INSERT INTO public.badges (slug, name, description, category, level, icon_name, rarity) VALUES
  ('all-in', 'ALL IN', 'Miser 100% de son solde', 'fun', NULL, 'Skull', 'rare'),
  ('dieu', 'DIEU', 'Gagner un pari à 1% de probabilité', 'fun', NULL, 'Zap', 'legendary'),
  ('risk-taker', 'RISK TAKER', 'Gagner un pari à ≤10% de probabilité', 'fun', NULL, 'Rocket', 'epic'),
  ('clown', 'CLOWN', 'Perdre ≥90% de ses paris', 'fun', NULL, 'Drama', 'rare'),
  ('noob', 'NOOB', 'Premier pari placé', 'fun', NULL, 'Sprout', 'common'),
  ('verified', 'VERIFIED', 'Profil complet (avatar + pseudo)', 'fun', NULL, 'BadgeCheck', 'common'),
  ('beta-tester', 'BETA TESTEUR', 'Parmi les 14 premiers joueurs', 'legacy', NULL, 'Star', 'legendary')
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- COMMENT
-- =============================================
COMMENT ON TABLE public.badges IS 'Catalogue de tous les badges disponibles';
COMMENT ON TABLE public.user_badges IS 'Inventaire des badges possédés par chaque utilisateur';
COMMENT ON COLUMN public.user_badges.is_equipped IS 'Maximum 2 badges peuvent être équipés simultanément';
COMMENT ON COLUMN public.user_badges.is_seen IS 'False = notification à afficher pour nouveau badge';

