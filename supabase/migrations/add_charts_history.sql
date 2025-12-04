-- Table pour l'historique des prix du marché (Events Charts)
CREATE TABLE IF NOT EXISTS public.market_prices_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    market_id UUID REFERENCES public.markets(id) ON DELETE CASCADE,
    outcome_index INTEGER NOT NULL, -- 0 pour NON/Index 0, 1 pour OUI/Index 1, etc.
    probability FLOAT NOT NULL, -- La côte (ex: 0.55 pour 55%)
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index pour récupérer rapidement l'historique d'un marché
CREATE INDEX IF NOT EXISTS idx_market_prices_history_market_id ON public.market_prices_history(market_id);

-- Table pour l'historique du PnL utilisateur (Profil Chart)
CREATE TABLE IF NOT EXISTS public.user_pnl_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    pnl_value FLOAT NOT NULL, -- La valeur cumulée du PnL à cet instant
    change_amount FLOAT NOT NULL, -- De combien ça a bougé (+1000, -500...)
    bet_id UUID REFERENCES public.bets(id) ON DELETE SET NULL, -- Le pari qui a causé ce changement
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index pour récupérer rapidement l'historique d'un user
CREATE INDEX IF NOT EXISTS idx_user_pnl_history_user_id ON public.user_pnl_history(user_id);

-- RLS Policies (Sécurité)
ALTER TABLE public.market_prices_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_pnl_history ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut voir l'historique des prix des marchés
CREATE POLICY "Everyone can view market prices history" 
ON public.market_prices_history FOR SELECT 
USING (true);

-- Seul le système (via server actions) insère des prix (pas les users directement)
-- On laisse l'admin insérer si besoin
CREATE POLICY "Admin can insert market prices" 
ON public.market_prices_history FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Les users peuvent voir leur propre historique PnL
CREATE POLICY "Users can view own pnl history" 
ON public.user_pnl_history FOR SELECT 
USING (auth.uid() = user_id);

-- Les admins peuvent tout voir
CREATE POLICY "Admins can view all pnl history" 
ON public.user_pnl_history FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

