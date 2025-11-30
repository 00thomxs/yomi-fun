-- Add direction column to bets table to track if user bet YES (For) or NO (Against) an outcome
ALTER TABLE public.bets 
ADD COLUMN IF NOT EXISTS direction TEXT DEFAULT 'YES' CHECK (direction IN ('YES', 'NO'));

