-- ============================================================================
-- Close public write access to the archived Vite site's tables
--
-- Run as `postgres` over DIRECT_URL (session mode, port 5432) or in the
-- Supabase SQL Editor:
--     psql "$DIRECT_URL" -f backend/prisma/manual/20260819_close_legacy_public_exposure.sql
--
-- WHAT WAS WRONG
--   Six tables in schema `public`, left behind by the archived React + Vite
--   site, granted `anon` and `authenticated` the full set —
--   SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER — and each
--   carried a permissive policy `demo_all_<table>` with USING (true).
--
--   `anon` is the role Supabase's public REST API uses for unauthenticated
--   callers, reachable with the publishable key that is compiled into the
--   shipped Vite bundle. So any visitor who had loaded that site could read,
--   rewrite or TRUNCATE:
--       attendance            72 rows
--       marks                 66 rows
--       class_subjects        13 rows
--       events                 6 rows
--       attendance_sessions    3 rows
--       registrations          0 rows
--
--   RLS was already enabled on all six. It did nothing, because the
--   demo_all_* policies said USING (true) — RLS with a permissive
--   everything-policy is RLS in name only.
--
-- WHY THIS IS SAFE TO APPLY
--   - The legacy site is archived and not deployed: no vercel.json, no
--     .vercel, no netlify.toml, and its own README states nothing new should
--     be built there.
--   - The current platform is unaffected. It reads `sfgc_platform`, pinned by
--     ?schema= on both connection strings, and holds no grants in `public`.
--   - The data is demo data (student_id 'SFGC101', class_id 'bcom-4a'), which
--     is why the policies were named demo_*. No rows are deleted here; only
--     access is withdrawn.
--
-- WHAT THIS DOES NOT DO
--   - It does not drop the tables or touch a single row. If the demo data is
--     wanted later it is all still there, reachable as postgres.
--   - It does not revoke USAGE on schema `public` from anon/authenticated.
--     That is shared with Supabase's own machinery and the blast radius of
--     being wrong is the entire schema. Withdrawing the table grants is what
--     closes this; schema USAGE alone reaches nothing.
--
-- ROLLBACK — restores the previous state exactly:
--   GRANT ALL ON public.attendance, public.attendance_sessions,
--     public.class_subjects, public.events, public.marks, public.registrations
--     TO anon, authenticated;
--   -- then recreate each policy:
--   CREATE POLICY demo_all_<table> ON public.<table>
--     FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
-- ============================================================================

BEGIN;

-- REVOKE and DROP POLICY both take locks on the table. Fail fast rather than
-- queue behind an idle transaction and stall anything else on the instance.
SET LOCAL lock_timeout = '3s';

DO $$
DECLARE
  t text;
  legacy_tables constant text[] := ARRAY[
    'attendance', 'attendance_sessions', 'class_subjects',
    'events', 'marks', 'registrations'
  ];
BEGIN
  FOREACH t IN ARRAY legacy_tables LOOP
    -- Fail loudly if the list has drifted from reality rather than skipping a
    -- table and reporting success while one stays open.
    IF to_regclass(format('public.%I', t)) IS NULL THEN
      RAISE EXCEPTION 'public.% does not exist — update this script', t;
    END IF;

    -- The grants are the control. With these withdrawn the policies below are
    -- already unreachable, but both go: a leftover USING(true) policy is a
    -- loaded gun for whoever next runs a well-meaning GRANT on this schema.
    EXECUTE format(
      'REVOKE ALL PRIVILEGES ON public.%I FROM anon, authenticated', t);

    -- PUBLIC too. Nothing shows a grant to it today, but a privilege held by
    -- PUBLIC is inherited by every role including anon, so re-asserting it
    -- costs nothing and closes the same door from the other side.
    EXECUTE format('REVOKE ALL PRIVILEGES ON public.%I FROM PUBLIC', t);

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'demo_all_' || t, t);

    -- RLS stays ON. All six already had it. With the permissive policy gone
    -- and no replacement, the default is deny for every role without
    -- BYPASSRLS — so if a grant is ever restored by accident, RLS is the
    -- second latch that still refuses.
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END
$$;

COMMIT;

-- ============================================================================
-- VERIFICATION — run after. Every query: ZERO ROWS = correct.
-- ============================================================================

-- V1. Any remaining privilege for anon/authenticated on the legacy tables.
SELECT grantee, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee IN ('anon', 'authenticated', 'PUBLIC')
  AND table_name IN ('attendance','attendance_sessions','class_subjects',
                     'events','marks','registrations');

-- V2. Any surviving permissive policy on those tables.
SELECT tablename, policyname, roles::text, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('attendance','attendance_sessions','class_subjects',
                    'events','marks','registrations');

-- V3. Any of the six with RLS switched off.
SELECT c.relname
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('attendance','attendance_sessions','class_subjects',
                    'events','marks','registrations')
  AND NOT c.relrowsecurity;

-- V4. The rows are all still there. NOT zero — expect
--     72, 3, 13, 6, 66, 0 respectively.
SELECT 'attendance' AS t, count(*) FROM public.attendance
UNION ALL SELECT 'attendance_sessions', count(*) FROM public.attendance_sessions
UNION ALL SELECT 'class_subjects', count(*) FROM public.class_subjects
UNION ALL SELECT 'events', count(*) FROM public.events
UNION ALL SELECT 'marks', count(*) FROM public.marks
UNION ALL SELECT 'registrations', count(*) FROM public.registrations;
