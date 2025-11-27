-- =============================================
-- YOMI.fun Database Schema
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- PROFILES TABLE
-- =============================================
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  balance INTEGER DEFAULT 10000 NOT NULL, -- Starting balance: 10,000 Zeny
  xp INTEGER DEFAULT 0 NOT NULL,
  level INTEGER DEFAULT 1 NOT NULL,
  streak INTEGER DEFAULT 0 NOT NULL,
  total_bets INTEGER DEFAULT 0 NOT NULL,
  total_won INTEGER DEFAULT 0 NOT NULL,
  win_rate DECIMAL(5,2) DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- =============================================
-- MARKETS TABLE
-- =============================================
CREATE TABLE public.markets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  question TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  image_url TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'resolved', 'cancelled')) NOT NULL,
  type TEXT DEFAULT 'binary' CHECK (type IN ('binary', 'multi')) NOT NULL,
  volume INTEGER DEFAULT 0 NOT NULL,
  is_live BOOLEAN DEFAULT false NOT NULL,
  is_featured BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  closes_at TIMESTAMP WITH TIME ZONE NOT NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES public.profiles(id)
);

-- =============================================
-- OUTCOMES TABLE
-- =============================================
CREATE TABLE public.outcomes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  market_id UUID REFERENCES public.markets(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  probability DECIMAL(5,2) DEFAULT 50 NOT NULL,
  color TEXT,
  is_winner BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- =============================================
-- BETS TABLE
-- =============================================
CREATE TABLE public.bets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  market_id UUID REFERENCES public.markets(id) ON DELETE CASCADE NOT NULL,
  outcome_id UUID REFERENCES public.outcomes(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  potential_payout INTEGER NOT NULL,
  odds_at_bet DECIMAL(10,4) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost', 'cancelled')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- =============================================
-- TRANSACTIONS TABLE
-- =============================================
CREATE TABLE public.transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('deposit', 'withdrawal', 'bet', 'win', 'bonus', 'refund')) NOT NULL,
  amount INTEGER NOT NULL,
  description TEXT,
  reference_id UUID, -- Can reference a bet_id or other
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- =============================================
-- BADGES TABLE
-- =============================================
CREATE TABLE public.badges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  xp_reward INTEGER DEFAULT 100 NOT NULL,
  condition_type TEXT NOT NULL, -- 'first_bet', 'streak_7', 'win_10', etc.
  condition_value INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- =============================================
-- USER_BADGES TABLE (Junction)
-- =============================================
CREATE TABLE public.user_badges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  badge_id UUID REFERENCES public.badges(id) ON DELETE CASCADE NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, badge_id)
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_markets_status ON public.markets(status);
CREATE INDEX idx_markets_category ON public.markets(category);
CREATE INDEX idx_markets_is_live ON public.markets(is_live);
CREATE INDEX idx_markets_is_featured ON public.markets(is_featured);
CREATE INDEX idx_outcomes_market_id ON public.outcomes(market_id);
CREATE INDEX idx_bets_user_id ON public.bets(user_id);
CREATE INDEX idx_bets_market_id ON public.bets(market_id);
CREATE INDEX idx_bets_status ON public.bets(status);
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_user_badges_user_id ON public.user_badges(user_id);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- PROFILES policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- MARKETS policies (everyone can read)
CREATE POLICY "Markets are viewable by everyone" ON public.markets
  FOR SELECT USING (true);

-- OUTCOMES policies (everyone can read)
CREATE POLICY "Outcomes are viewable by everyone" ON public.outcomes
  FOR SELECT USING (true);

-- BETS policies
CREATE POLICY "Users can view their own bets" ON public.bets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bets" ON public.bets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- TRANSACTIONS policies
CREATE POLICY "Users can view their own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- BADGES policies (everyone can read)
CREATE POLICY "Badges are viewable by everyone" ON public.badges
  FOR SELECT USING (true);

-- USER_BADGES policies
CREATE POLICY "User badges are viewable by everyone" ON public.user_badges
  FOR SELECT USING (true);

CREATE POLICY "System can insert user badges" ON public.user_badges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || LEFT(NEW.id::text, 8)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =============================================
-- SEED DATA: Default Badges
-- =============================================
INSERT INTO public.badges (name, description, icon, xp_reward, condition_type, condition_value) VALUES
  ('Premier Pari', 'Tu as placé ton premier pari !', '🎯', 100, 'first_bet', 1),
  ('Streak 7', '7 jours de connexion consécutifs', '🔥', 250, 'streak', 7),
  ('Streak 30', '30 jours de connexion consécutifs', '💎', 1000, 'streak', 30),
  ('Gagnant x10', '10 paris gagnés', '🏆', 500, 'wins', 10),
  ('Gagnant x50', '50 paris gagnés', '👑', 2000, 'wins', 50),
  ('High Roller', 'Pari de plus de 10,000 Zeny', '💰', 300, 'big_bet', 10000),
  ('Devin', '5 paris gagnés d''affilée', '🔮', 750, 'win_streak', 5),
  ('Vétéran', '100 paris placés', '⭐', 1500, 'total_bets', 100);

-- =============================================
-- SEED DATA: Sample Markets (for testing)
-- =============================================
INSERT INTO public.markets (question, description, category, image_url, status, type, is_live, is_featured, closes_at) VALUES
  (
    'Squeezie va-t-il gagner le GP Explorer 4 ?',
    'Le YouTubeur français Squeezie participera au GP Explorer 4. Va-t-il remporter la victoire ?',
    'YouTube',
    '/images/gp-explorer.webp',
    'open',
    'binary',
    true,
    true,
    NOW() + INTERVAL '7 days'
  ),
  (
    'Qui sera l''artiste français de l''année aux NMA 2025 ?',
    'Les Victoires de la Musique approchent. Qui remportera le titre d''artiste de l''année ?',
    'Musique',
    '/french-rap-music-artist-microphone-stage-dark.jpg',
    'open',
    'multi',
    false,
    false,
    NOW() + INTERVAL '30 days'
  );

-- Get the market IDs for outcomes
DO $$
DECLARE
  gp_market_id UUID;
  nma_market_id UUID;
BEGIN
  SELECT id INTO gp_market_id FROM public.markets WHERE question LIKE '%GP Explorer%' LIMIT 1;
  SELECT id INTO nma_market_id FROM public.markets WHERE question LIKE '%NMA 2025%' LIMIT 1;

  -- Outcomes for GP Explorer (binary)
  INSERT INTO public.outcomes (market_id, name, probability, color) VALUES
    (gp_market_id, 'OUI', 72, '#10b981'),
    (gp_market_id, 'NON', 28, '#f43f5e');

  -- Outcomes for NMA (multi)
  INSERT INTO public.outcomes (market_id, name, probability, color) VALUES
    (nma_market_id, 'Ninho', 28, '#3b82f6'),
    (nma_market_id, 'Jul', 24, '#8b5cf6'),
    (nma_market_id, 'Aya Nakamura', 22, '#ec4899'),
    (nma_market_id, 'SCH', 15, '#f59e0b'),
    (nma_market_id, 'Autre', 11, '#6b7280');
END $$;

