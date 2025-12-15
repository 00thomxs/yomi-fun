-- Add is_visible column to markets table
-- This allows admins to hide events from users without deleting them
-- Users keep their bet history and stats

ALTER TABLE public.markets 
ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true NOT NULL;

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_markets_is_visible ON public.markets(is_visible);

-- Comment for documentation
COMMENT ON COLUMN public.markets.is_visible IS 'Whether the market is visible to users. Hidden markets preserve bet history and stats.';

