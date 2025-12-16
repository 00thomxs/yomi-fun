-- Daily Rewards System (Gacha Streak)
-- Adds columns to track daily bonus claims and streak progress

-- Add daily reward tracking columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_daily_claim TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS daily_streak INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS welcome_bonus_claimed BOOLEAN DEFAULT false NOT NULL;

-- Index for efficient daily claim checks
CREATE INDEX IF NOT EXISTS idx_profiles_last_daily_claim ON public.profiles(last_daily_claim);

-- Comments for documentation
COMMENT ON COLUMN public.profiles.last_daily_claim IS 'Timestamp of last daily bonus claim. NULL if never claimed.';
COMMENT ON COLUMN public.profiles.daily_streak IS 'Current streak day (0-6). Resets to 0 after day 6 claim or if 24h+ missed.';
COMMENT ON COLUMN public.profiles.welcome_bonus_claimed IS 'Whether the user has claimed their welcome bonus (200 Zeny).';

