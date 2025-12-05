-- Add columns for season state management
ALTER TABLE public.season_settings 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS rewards_distributed BOOLEAN DEFAULT false NOT NULL;

-- Update existing row to have season inactive by default
UPDATE public.season_settings 
SET is_active = false, rewards_distributed = false 
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Comment: 
-- is_active = true means a season is currently running
-- rewards_distributed = true means the rewards have been given out (prevents double distribution)

