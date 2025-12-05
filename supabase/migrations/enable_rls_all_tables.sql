-- =============================================
-- ENABLE RLS ON ALL TABLES
-- Script idempotent (safe to run multiple times)
-- =============================================

-- =============================================
-- 1. ENABLE RLS ON ALL TABLES
-- =============================================

-- Core tables
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_badges ENABLE ROW LEVEL SECURITY;

-- Shop tables
ALTER TABLE IF EXISTS public.shop_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;

-- Charts history tables
ALTER TABLE IF EXISTS public.market_prices_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_pnl_history ENABLE ROW LEVEL SECURITY;

-- Storage preferences (if exists)
ALTER TABLE IF EXISTS public.storage_preferences ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 2. DROP EXISTING POLICIES (to recreate cleanly)
-- =============================================

-- Profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin can update any profile" ON public.profiles;

-- Markets
DROP POLICY IF EXISTS "Markets are viewable by everyone" ON public.markets;
DROP POLICY IF EXISTS "Admin can manage markets" ON public.markets;

-- Outcomes
DROP POLICY IF EXISTS "Outcomes are viewable by everyone" ON public.outcomes;
DROP POLICY IF EXISTS "Admin can manage outcomes" ON public.outcomes;

-- Bets
DROP POLICY IF EXISTS "Users can view their own bets" ON public.bets;
DROP POLICY IF EXISTS "Users can create their own bets" ON public.bets;
DROP POLICY IF EXISTS "Admin can view all bets" ON public.bets;

-- Transactions
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can create their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admin can view all transactions" ON public.transactions;

-- Badges
DROP POLICY IF EXISTS "Badges are viewable by everyone" ON public.badges;
DROP POLICY IF EXISTS "Admin can manage badges" ON public.badges;

-- User badges
DROP POLICY IF EXISTS "User badges are viewable by everyone" ON public.user_badges;
DROP POLICY IF EXISTS "System can insert user badges" ON public.user_badges;

-- Shop items
DROP POLICY IF EXISTS "Shop items are viewable by everyone" ON public.shop_items;
DROP POLICY IF EXISTS "Admin can manage shop items" ON public.shop_items;

-- Orders
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admin can update orders" ON public.orders;

-- Market prices history
DROP POLICY IF EXISTS "Everyone can view market prices history" ON public.market_prices_history;
DROP POLICY IF EXISTS "Admin can insert market prices" ON public.market_prices_history;
DROP POLICY IF EXISTS "Service role can insert market prices" ON public.market_prices_history;

-- User PnL history
DROP POLICY IF EXISTS "Users can view own pnl history" ON public.user_pnl_history;
DROP POLICY IF EXISTS "Admins can view all pnl history" ON public.user_pnl_history;
DROP POLICY IF EXISTS "Service role can insert pnl history" ON public.user_pnl_history;

-- =============================================
-- 3. CREATE POLICIES
-- =============================================

-- ----- PROFILES -----
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Admin can update any profile" ON public.profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ----- MARKETS -----
CREATE POLICY "Markets are viewable by everyone" ON public.markets
  FOR SELECT USING (true);

CREATE POLICY "Admin can manage markets" ON public.markets
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ----- OUTCOMES -----
CREATE POLICY "Outcomes are viewable by everyone" ON public.outcomes
  FOR SELECT USING (true);

CREATE POLICY "Admin can manage outcomes" ON public.outcomes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ----- BETS -----
CREATE POLICY "Users can view their own bets" ON public.bets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bets" ON public.bets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can view all bets" ON public.bets
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ----- TRANSACTIONS -----
CREATE POLICY "Users can view their own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can view all transactions" ON public.transactions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ----- BADGES -----
CREATE POLICY "Badges are viewable by everyone" ON public.badges
  FOR SELECT USING (true);

CREATE POLICY "Admin can manage badges" ON public.badges
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ----- USER_BADGES -----
CREATE POLICY "User badges are viewable by everyone" ON public.user_badges
  FOR SELECT USING (true);

CREATE POLICY "System can insert user badges" ON public.user_badges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ----- SHOP_ITEMS -----
CREATE POLICY "Shop items are viewable by everyone" ON public.shop_items
  FOR SELECT USING (true);

CREATE POLICY "Admin can manage shop items" ON public.shop_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ----- ORDERS -----
CREATE POLICY "Users can view their own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders" ON public.orders
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin can update orders" ON public.orders
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ----- MARKET_PRICES_HISTORY -----
CREATE POLICY "Everyone can view market prices history" ON public.market_prices_history
  FOR SELECT USING (true);

-- Note: Insertion is done via service role (supabaseAdmin) in server actions
-- No user-level INSERT policy needed

-- ----- USER_PNL_HISTORY -----
CREATE POLICY "Users can view own pnl history" ON public.user_pnl_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all pnl history" ON public.user_pnl_history
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Note: Insertion is done via service role (supabaseAdmin) in server actions
-- No user-level INSERT policy needed

-- =============================================
-- 4. GRANT SERVICE ROLE BYPASS (for server actions)
-- =============================================

-- The service_role key automatically bypasses RLS
-- No additional grants needed if using supabaseAdmin client

-- =============================================
-- DONE!
-- =============================================

