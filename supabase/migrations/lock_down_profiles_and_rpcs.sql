-- =============================================
-- LOCK DOWN: profiles, markets, outcomes, bets + privileged SQL functions
-- Idempotent. Run AFTER all other migrations, and AFTER the app code that
-- writes through supabaseAdmin is deployed (that code works with or without
-- this migration, so deploying it first leaves no broken window).
-- =============================================
-- Why (checked on the live DB, 2026-11-05):
-- - Policies "Allow update ... for all" (USING true, roles public) let ANYONE,
--   even logged-out visitors with the public anon key, update any profile
--   (balance, role = 'admin'), any market, outcome or bet.
-- - "Users can create their own bets" let a player insert a pending bet with
--   any potential_payout without paying for it.
-- - Every SECURITY DEFINER function (reset_platform, increment_balance, ...)
--   was executable by anon and authenticated.
-- From now on these writes happen server-side with the service role key
-- (supabaseAdmin), which bypasses RLS and these grants.

-- ---------------------------------------------
-- 1. DROP THE WIDE-OPEN POLICIES
-- ---------------------------------------------
DROP POLICY IF EXISTS "Allow update profiles for all" ON public.profiles;
DROP POLICY IF EXISTS "Allow update markets for all"  ON public.markets;
DROP POLICY IF EXISTS "Allow update outcomes for all" ON public.outcomes;
DROP POLICY IF EXISTS "Allow update bets for all"     ON public.bets;
DROP POLICY IF EXISTS "Users can create their own bets" ON public.bets;
-- Admin writes on markets/outcomes keep working through "Admin can manage ..."

-- ---------------------------------------------
-- 2. PROFILES: players may only edit their own display settings
-- ---------------------------------------------
REVOKE INSERT, UPDATE, DELETE ON public.profiles FROM anon, authenticated;

-- Columns edited from components/profile/edit-profile-form.tsx
GRANT UPDATE (username, avatar_url, email_notif_win, email_notif_marketing, updated_at)
  ON public.profiles TO authenticated;
-- Profiles are created by the handle_new_user trigger (SECURITY DEFINER).

-- Bets are only written server-side now.
REVOKE INSERT, UPDATE, DELETE ON public.bets FROM anon, authenticated;

-- ---------------------------------------------
-- 3. PRIVILEGED FUNCTIONS: server (service_role) only
-- ---------------------------------------------
-- Looked up by name so every overload in the live DB is covered.
DO $$
DECLARE
  fn regprocedure;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'reset_platform',
        'increment_balance',
        'update_winner_stats',
        'update_loser_stats',
        'award_badge',
        'upsert_season_leaderboard',
        'capture_season_leaderboard_snapshot',
        'purchase_cosmetic',
        'update_user_card_tier',
        'calculate_card_tier',
        'get_admin_platform_stats'
      )
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn);
  END LOOP;
END $$;

-- ---------------------------------------------
-- 4. CHECK (run after, expect: all false / 0 rows)
-- ---------------------------------------------
-- SELECT has_column_privilege('authenticated', 'public.profiles', 'balance', 'UPDATE'),
--        has_column_privilege('authenticated', 'public.profiles', 'role', 'UPDATE'),
--        has_table_privilege('anon', 'public.profiles', 'UPDATE'),
--        has_table_privilege('authenticated', 'public.bets', 'INSERT');
-- SELECT tablename, policyname FROM pg_policies
--  WHERE schemaname = 'public' AND policyname LIKE 'Allow update % for all';
-- SELECT p.proname FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
--  WHERE n.nspname = 'public'
--    AND p.proname IN ('reset_platform','increment_balance','update_winner_stats','award_badge')
--    AND (has_function_privilege('anon', p.oid, 'EXECUTE')
--         OR has_function_privilege('authenticated', p.oid, 'EXECUTE'));
