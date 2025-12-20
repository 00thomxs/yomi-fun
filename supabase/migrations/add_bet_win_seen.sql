-- Add column to track if user has seen their win popup
ALTER TABLE public.bets 
ADD COLUMN IF NOT EXISTS win_seen_at TIMESTAMPTZ DEFAULT NULL;

-- Index for faster queries on unseen wins
CREATE INDEX IF NOT EXISTS idx_bets_unseen_wins 
ON public.bets(user_id, status, win_seen_at) 
WHERE status = 'won' AND win_seen_at IS NULL;

