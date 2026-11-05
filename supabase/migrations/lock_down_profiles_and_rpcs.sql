-- =============================================
-- LOCK DOWN: profiles columns + privileged SQL functions
-- Idempotent. Run AFTER all other migrations.
-- =============================================
-- Why: the "Users can update their own profile" RLS policy limits WHICH ROW a
-- player can update, not WHICH COLUMNS. With the public anon key, any logged-in
-- player could set their own balance or role = 'admin'. And SECURITY DEFINER
-- functions (reset_platform, increment_balance, ...) were executable by every
-- logged-in user. From now on, balance/role/stats are only written server-side
-- with the service role key (supabaseAdmin), which ignores these grants.

-- ---------------------------------------------
-- 1. PROFILES: players may only edit their own display settings
-- ---------------------------------------------
REVOKE INSERT, UPDATE ON public.profiles FROM anon, authenticated;

-- Columns edited from components/profile/edit-profile-form.tsx
GRANT UPDATE (username, avatar_url, email_notif_win, email_notif_marketing, updated_at)
  ON public.profiles TO authenticated;

-- Profiles are created by the handle_new_user trigger (SECURITY DEFINER),
-- so players never need INSERT.

-- ---------------------------------------------
-- 2. PRIVILEGED FUNCTIONS: server (service_role) only
-- ---------------------------------------------
-- Looked up by name so it works whatever the exact signature is in the live DB.
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
        'get_admin_platform_stats'
      )
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn);
  END LOOP;
END $$;

-- ---------------------------------------------
-- 3. CHECK (run after, expect: false / false / 0 rows)
-- ---------------------------------------------
-- SELECT has_column_privilege('authenticated', 'public.profiles', 'balance', 'UPDATE');
-- SELECT has_column_privilege('authenticated', 'public.profiles', 'role', 'UPDATE');
-- SELECT p.proname FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
--  WHERE n.nspname = 'public'
--    AND p.proname IN ('reset_platform','increment_balance','update_winner_stats','award_badge')
--    AND has_function_privilege('authenticated', p.oid, 'EXECUTE');
