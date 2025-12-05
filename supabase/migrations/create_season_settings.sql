-- Table for Season Configuration
CREATE TABLE IF NOT EXISTS public.season_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  cash_prize INTEGER DEFAULT 1000 NOT NULL,
  season_end TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days') NOT NULL,
  
  -- Physical/Main Prizes for Top 3
  top1_prize TEXT DEFAULT 'PlayStation 5',
  top2_prize TEXT DEFAULT 'AirPods Pro 2',
  top3_prize TEXT DEFAULT 'Bon Amazon 50€',
  
  -- Zeny Rewards for Top 10 (JSON array of amounts)
  -- Index 0 = 1st place, Index 9 = 10th place
  zeny_rewards JSONB DEFAULT '[50000, 25000, 10000, 5000, 5000, 2500, 2500, 1000, 1000, 1000]'::jsonb,
  
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.season_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Season settings viewable by everyone" 
  ON public.season_settings FOR SELECT USING (true);

CREATE POLICY "Admin can update season settings" 
  ON public.season_settings FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin can insert season settings" 
  ON public.season_settings FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Seed initial data if empty
INSERT INTO public.season_settings (cash_prize, season_end)
SELECT 1000, NOW() + INTERVAL '30 days'
WHERE NOT EXISTS (SELECT 1 FROM public.season_settings);

