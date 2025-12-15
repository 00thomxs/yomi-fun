-- =============================================
-- SEASONS ARCHITECTURE MIGRATION
-- Creates seasons tracking and per-season leaderboards
-- =============================================

-- =============================================
-- 1. SEASONS TABLE
-- Stores all seasons (past and current)
-- =============================================
CREATE TABLE IF NOT EXISTS public.seasons (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,                                    -- e.g., "Saison 1", "Saison Alpha"
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT false NOT NULL,              -- Only ONE season can be active
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- UNIQUE partial index to ensure only ONE season can be active at a time
-- This prevents race conditions if two admins start a season simultaneously
CREATE UNIQUE INDEX IF NOT EXISTS idx_seasons_single_active ON public.seasons(is_active) WHERE is_active = true;

-- =============================================
-- 2. ADD season_id TO MARKETS
-- Links markets to a specific season (nullable for global markets)
-- =============================================
ALTER TABLE public.markets 
ADD COLUMN IF NOT EXISTS season_id UUID REFERENCES public.seasons(id) ON DELETE SET NULL;

-- Index for filtering markets by season
CREATE INDEX IF NOT EXISTS idx_markets_season_id ON public.markets(season_id);

-- =============================================
-- 3. SEASON LEADERBOARDS TABLE
-- Stores per-user stats for each season
-- =============================================
CREATE TABLE IF NOT EXISTS public.season_leaderboards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  season_id UUID REFERENCES public.seasons(id) ON DELETE CASCADE NOT NULL,
  points INTEGER DEFAULT 0 NOT NULL,                     -- Total PnL for this season
  wins INTEGER DEFAULT 0 NOT NULL,                       -- Number of winning bets
  losses INTEGER DEFAULT 0 NOT NULL,                     -- Number of losing bets
  total_bet_amount INTEGER DEFAULT 0 NOT NULL,           -- Total amount wagered
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Ensure one entry per user per season
  CONSTRAINT unique_user_season UNIQUE (user_id, season_id)
);

-- Indexes for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_season_leaderboards_user_id ON public.season_leaderboards(user_id);
CREATE INDEX IF NOT EXISTS idx_season_leaderboards_season_id ON public.season_leaderboards(season_id);
CREATE INDEX IF NOT EXISTS idx_season_leaderboards_points ON public.season_leaderboards(points DESC);

-- =============================================
-- 4. ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on new tables
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.season_leaderboards ENABLE ROW LEVEL SECURITY;

-- SEASONS Policies (everyone can read, admin can manage)
CREATE POLICY "Seasons are viewable by everyone" 
  ON public.seasons FOR SELECT USING (true);

CREATE POLICY "Admin can insert seasons" 
  ON public.seasons FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin can update seasons" 
  ON public.seasons FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin can delete seasons" 
  ON public.seasons FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- SEASON_LEADERBOARDS Policies (everyone can read, system updates via service role)
CREATE POLICY "Season leaderboards are viewable by everyone" 
  ON public.season_leaderboards FOR SELECT USING (true);

-- Note: INSERT/UPDATE will be done via supabaseAdmin (service role) to bypass RLS

-- =============================================
-- 5. TRIGGERS FOR updated_at
-- =============================================

-- Trigger for seasons updated_at
CREATE TRIGGER update_seasons_updated_at
  BEFORE UPDATE ON public.seasons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Trigger for season_leaderboards updated_at  
CREATE TRIGGER update_season_leaderboards_updated_at
  BEFORE UPDATE ON public.season_leaderboards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =============================================
-- 6. HELPER FUNCTION: Get Active Season ID
-- =============================================
CREATE OR REPLACE FUNCTION public.get_active_season_id()
RETURNS UUID AS $$
  SELECT id FROM public.seasons WHERE is_active = true LIMIT 1;
$$ LANGUAGE sql STABLE;

-- =============================================
-- 7. HELPER FUNCTION: Upsert Season Leaderboard Entry
-- Called during market resolution to update user's season stats
-- =============================================
CREATE OR REPLACE FUNCTION public.upsert_season_leaderboard(
  p_user_id UUID,
  p_season_id UUID,
  p_points_change INTEGER,
  p_is_win BOOLEAN,
  p_bet_amount INTEGER
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.season_leaderboards (user_id, season_id, points, wins, losses, total_bet_amount)
  VALUES (
    p_user_id, 
    p_season_id, 
    p_points_change, 
    CASE WHEN p_is_win THEN 1 ELSE 0 END,
    CASE WHEN p_is_win THEN 0 ELSE 1 END,
    p_bet_amount
  )
  ON CONFLICT (user_id, season_id) DO UPDATE SET
    points = season_leaderboards.points + p_points_change,
    wins = season_leaderboards.wins + CASE WHEN p_is_win THEN 1 ELSE 0 END,
    losses = season_leaderboards.losses + CASE WHEN p_is_win THEN 0 ELSE 1 END,
    total_bet_amount = season_leaderboards.total_bet_amount + p_bet_amount,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

