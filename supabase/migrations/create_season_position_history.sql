-- Season Position History: Track daily leaderboard snapshots for race charts
-- This allows us to show the evolution of top players over time

CREATE TABLE IF NOT EXISTS public.season_position_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  season_id UUID REFERENCES public.seasons(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  captured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  position INTEGER NOT NULL, -- Rank at this snapshot
  points INTEGER NOT NULL, -- PnL at this snapshot
  wins INTEGER DEFAULT 0 NOT NULL,
  losses INTEGER DEFAULT 0 NOT NULL,
  total_bets INTEGER DEFAULT 0 NOT NULL
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_season_position_history_season 
  ON public.season_position_history(season_id, captured_at DESC);

CREATE INDEX IF NOT EXISTS idx_season_position_history_user 
  ON public.season_position_history(user_id, season_id);

-- Unique constraint: one snapshot per user per day per season
CREATE UNIQUE INDEX IF NOT EXISTS idx_season_position_history_unique 
  ON public.season_position_history(season_id, user_id, DATE(captured_at));

-- RLS
ALTER TABLE public.season_position_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Season position history is viewable by everyone"
  ON public.season_position_history
  FOR SELECT
  USING (true);

CREATE POLICY "Admin can insert season position history"
  ON public.season_position_history
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Function to capture a snapshot of the current season leaderboard
CREATE OR REPLACE FUNCTION public.capture_season_leaderboard_snapshot(p_season_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  -- Insert current standings for top 50 players
  INSERT INTO public.season_position_history (season_id, user_id, position, points, wins, losses, total_bets)
  SELECT 
    p_season_id,
    sl.user_id,
    ROW_NUMBER() OVER (ORDER BY sl.points DESC, sl.wins DESC) as position,
    sl.points,
    sl.wins,
    sl.losses,
    sl.wins + sl.losses as total_bets
  FROM public.season_leaderboards sl
  WHERE sl.season_id = p_season_id
    AND (sl.wins + sl.losses) > 0 -- Only players who participated
  ORDER BY sl.points DESC, sl.wins DESC
  LIMIT 50
  ON CONFLICT (season_id, user_id, DATE(captured_at)) 
  DO UPDATE SET
    position = EXCLUDED.position,
    points = EXCLUDED.points,
    wins = EXCLUDED.wins,
    losses = EXCLUDED.losses,
    total_bets = EXCLUDED.total_bets;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

COMMENT ON TABLE public.season_position_history IS 'Daily snapshots of season leaderboard for tracking position evolution over time';
COMMENT ON FUNCTION public.capture_season_leaderboard_snapshot IS 'Captures current season standings - call after each market resolution or daily';

