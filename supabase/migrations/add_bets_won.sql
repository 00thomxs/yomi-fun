-- Add bets_won column to profiles to track number of wins separately from total amount won
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bets_won INTEGER DEFAULT 0 NOT NULL;

-- Update existing bets_won based on status 'won' in bets table
UPDATE public.profiles p
SET bets_won = (
    SELECT COUNT(*)
    FROM public.bets b
    WHERE b.user_id = p.id AND b.status = 'won'
);

