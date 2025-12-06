-- =============================================
-- MIGRATION: Complete Missing Schema Elements
-- Run this AFTER schema.sql and all other migrations
-- =============================================

-- =============================================
-- 1. ADD ROLE COLUMN TO PROFILES (CRITICAL!)
-- =============================================
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- =============================================
-- 2. ADD TITLE TO SEASON_SETTINGS
-- =============================================
ALTER TABLE public.season_settings 
ADD COLUMN IF NOT EXISTS title TEXT DEFAULT 'Saison';

-- =============================================
-- 2b. ADD MISSING COLUMNS TO MARKETS (CRITICAL!)
-- =============================================
ALTER TABLE public.markets 
ADD COLUMN IF NOT EXISTS pool_yes INTEGER DEFAULT 100 NOT NULL,
ADD COLUMN IF NOT EXISTS pool_no INTEGER DEFAULT 100 NOT NULL,
ADD COLUMN IF NOT EXISTS is_headline BOOLEAN DEFAULT false NOT NULL;

-- =============================================
-- 3. CREATE PAST_SEASONS TABLE (for season history)
-- =============================================
CREATE TABLE IF NOT EXISTS public.past_seasons (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'Saison',
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  winners JSONB DEFAULT '[]'::jsonb, -- Array of {rank, username, avatar, reward}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on past_seasons
ALTER TABLE public.past_seasons ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (in case they exist)
DROP POLICY IF EXISTS "Past seasons are viewable by everyone" ON public.past_seasons;
DROP POLICY IF EXISTS "Admin can manage past seasons" ON public.past_seasons;

-- Everyone can view past seasons
CREATE POLICY "Past seasons are viewable by everyone" 
ON public.past_seasons FOR SELECT USING (true);

-- Admin can manage past seasons
CREATE POLICY "Admin can manage past seasons" 
ON public.past_seasons FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- =============================================
-- 4. CONVERT TO BIGINT FOR LARGE AMOUNTS
-- =============================================
-- Note: This may fail if there's data - run on fresh DB or handle manually

-- Profiles balance
ALTER TABLE public.profiles 
ALTER COLUMN balance TYPE BIGINT;

-- Bets amount and payout
ALTER TABLE public.bets 
ALTER COLUMN amount TYPE BIGINT,
ALTER COLUMN potential_payout TYPE BIGINT;

-- Transactions amount
ALTER TABLE public.transactions 
ALTER COLUMN amount TYPE BIGINT;

-- Shop items price
ALTER TABLE public.shop_items 
ALTER COLUMN price TYPE BIGINT;

-- Orders price_paid
ALTER TABLE public.orders 
ALTER COLUMN price_paid TYPE BIGINT;

-- =============================================
-- 5. RESET PLATFORM FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION reset_platform()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete all bets
  DELETE FROM public.bets WHERE true;
  
  -- Delete all transactions
  DELETE FROM public.transactions WHERE true;
  
  -- Delete all orders
  DELETE FROM public.orders WHERE true;
  
  -- Delete all outcomes (before markets due to FK)
  DELETE FROM public.outcomes WHERE true;
  
  -- Delete all markets
  DELETE FROM public.markets WHERE true;
  
  -- Reset all user stats + balance to 0
  UPDATE public.profiles SET 
    balance = 0,
    total_won = 0,
    total_bets = 0,
    win_rate = 0,
    streak = 0,
    bets_won = 0,
    xp = 0
  WHERE true;
END;
$$;

-- Grant execute to authenticated users (admin check is done in the app)
GRANT EXECUTE ON FUNCTION reset_platform() TO authenticated;
GRANT EXECUTE ON FUNCTION reset_platform() TO service_role;

-- =============================================
-- 5b. INCREMENT_BALANCE FUNCTION (fallback for resolve)
-- =============================================
CREATE OR REPLACE FUNCTION increment_balance(
  p_user_id UUID,
  p_amount BIGINT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET balance = balance + p_amount
  WHERE id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION increment_balance(UUID, BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_balance(UUID, BIGINT) TO service_role;

-- =============================================
-- 6. ALLOW SEASON_REWARD TRANSACTION TYPE
-- =============================================
-- Drop existing constraint if exists and recreate with new type
ALTER TABLE public.transactions 
DROP CONSTRAINT IF EXISTS transactions_type_check;

ALTER TABLE public.transactions 
ADD CONSTRAINT transactions_type_check 
CHECK (type IN ('deposit', 'withdrawal', 'bet', 'win', 'bonus', 'refund', 'season_reward', 'purchase'));

-- =============================================
-- DONE! All missing schema elements added.
-- =============================================

