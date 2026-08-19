-- ============================================================================
-- sfgc_api: dedicated least-privilege runtime role for the SFGC platform API
-- Target: Supabase Postgres 17.6, project ref omqvpahtcuwxpvdnxjlq
-- Schema: sfgc_platform (12 application tables + _prisma_migrations)
--
-- WHAT THIS PROTECTS AGAINST
--   A leak of the RUNTIME connection string (DATABASE_URL) alone. With that
--   string an attacker gets exactly the DML the API itself performs, and:
--     - cannot DROP or ALTER anything (owns nothing)
--     - cannot CREATE tables/functions/views in sfgc_platform (no CREATE)
--     - cannot TRUNCATE anything (privilege withheld)
--     - cannot read or forge _prisma_migrations (no grant at all)
--     - cannot create roles, databases, or replication slots
--     - cannot reach auth, storage, extensions, graphql_public
--     - cannot read the legacy Vite tables in public (they grant only
--       postgres/anon/authenticated/service_role, never PUBLIC)
--   Plus: the RLS layer denies anon and authenticated even if someone later
--   runs a careless GRANT on this schema.
--
-- WHAT THIS DOES *NOT* PROTECT AGAINST -- do not oversell it
--   1. This is NOT per-user isolation. The API is one connection; RLS cannot
--      tell one student from another. Every policy here is USING(true).
--   2. It does NOT protect confidentiality of data. A leaked sfgc_api string
--      still reads all 47 users (bcrypt hashes, emails, phones, guardian
--      phones), 3,828 attendance rows, and 126 progress cards.
--   3. It does NOT prevent privilege escalation INTO the application:
--      UPDATE users SET "passwordHash"=..., role='SUPER_ADMIN' is permitted,
--      because auth.routes.ts:123-124 and academics.routes.ts:528/583 write
--      those columns at runtime, so a column-level grant is unavailable until
--      that code is refactored.
--   4. RLS does NOT deny "every other role". postgres, service_role,
--      supabase_admin, supabase_etl_admin and supabase_read_only_user all have
--      rolbypassrls = true; policies are never consulted for them. What keeps
--      them out of sfgc_platform today is the ABSENCE of GRANTs and of schema
--      USAGE. The GRANT layer is the control; RLS is a second latch that binds
--      only NOBYPASSRLS roles (anon, authenticated, and any future role).
--   5. It buys NOTHING while DIRECT_URL (the unrestricted `postgres`
--      credential) is set on the same Render service. Removing DIRECT_URL from
--      the server environment and rotating the postgres password are worth
--      more than this entire script. Do those in the same change window.
--   6. It does not touch the live exposure in schema public: the six legacy
--      tables grant arwdDxtm to anon with demo_all_* USING(true) policies, and
--      the publishable key is compiled into the shipped Vite bundle. That is a
--      separate, more urgent ticket.
-- ============================================================================


-- ============================================================================
-- PART A -- OPERATOR, ONCE. Run as `postgres` on the SESSION-mode connection
-- (DIRECT_URL, port 5432) or the Supabase SQL Editor. NOT part of any
-- migration; contains a secret and must never be replayed automatically.
-- ============================================================================

-- psql only. Keeps the password out of ~/.psql_history.
\set HISTFILE /dev/null
\prompt 'New password for sfgc_api (alphanumeric only -- see note): ' sfgc_api_pw

-- NOTE ON THE PASSWORD:
--   * Use A-Z a-z 0-9 only. The password goes into a URI; @ : / ? # & % all
--     need percent-encoding and this is a classic 3am outage.
--   * Do NOT set VALID UNTIL. Supavisor authenticates via
--     pgbouncer.get_auth(), which is
--       SELECT rolname, rolpassword FROM pg_authid WHERE rolname=$1 AND rolcanlogin
--     and returns NULL once rolvaliduntil has passed -> silent total outage.
--   * NOBYPASSRLS is explicit, not default-implied, because it is the single
--     attribute that makes the policies below mean anything for this role.
--   * NOCREATEROLE matters more than it looks: CREATEROLE in PG16+ can still
--     be used to create a new role and grant it things, i.e. to persist.
--
-- Idempotent: CREATE on first run, password rotation on every later run.
SELECT CASE
  WHEN EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'sfgc_api')
    THEN format('ALTER ROLE sfgc_api WITH LOGIN NOSUPERUSER NOCREATEDB '
                'NOCREATEROLE NOREPLICATION NOBYPASSRLS PASSWORD %L', :'sfgc_api_pw')
  ELSE format('CREATE ROLE sfgc_api WITH LOGIN NOSUPERUSER NOCREATEDB '
              'NOCREATEROLE NOREPLICATION NOBYPASSRLS PASSWORD %L', :'sfgc_api_pw')
END \gexec

-- If you are pasting into the Supabase SQL Editor instead (no \prompt there),
-- use the literal form and clear the editor tab afterwards:
--   CREATE ROLE sfgc_api WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE
--     NOREPLICATION NOBYPASSRLS PASSWORD 'REPLACE_ME';

-- OPTIONAL, operator convenience only. Prisma sends ?schema=sfgc_platform on
-- the URL and overrides this, so it changes nothing for the API -- it only
-- saves you typing the schema prefix in psql sessions.
-- ALTER ROLE sfgc_api SET search_path = sfgc_platform;

-- OPTIONAL HARDENING, evaluate before running: PUBLIC holds TEMPORARY on this
-- database (datacl '=Tc'), so a leaked sfgc_api credential can create temp
-- tables and burn disk on the instance serving the college. Nothing in either
-- app uses temp tables -- but this revoke also affects anon/authenticated and
-- therefore the production legacy Vite site, so it is left commented out.
-- Rollback is: GRANT TEMPORARY ON DATABASE postgres TO PUBLIC;
-- REVOKE TEMPORARY ON DATABASE postgres FROM PUBLIC;

-- Do NOT revoke CONNECT from PUBLIC: sfgc_api inherits CONNECT from PUBLIC and
-- there is no explicit grant here, so revoking it locks the API out.
-- Do NOT revoke USAGE on schema public from PUBLIC: shared with the legacy
-- site's roles, and the blast radius of being wrong is the whole public schema.


-- ============================================================================
-- PART B -- THE CHANGE ITSELF.
-- Save as: backend/prisma/manual/20260819_sfgc_api_least_privilege.sql
-- Run as `postgres` over DIRECT_URL (port 5432), by hand:
--     psql "$DIRECT_URL" -f backend/prisma/manual/20260819_sfgc_api_least_privilege.sql
--
-- Deliberately NOT a Prisma migration: it must run as the owner, it must never
-- be replayed against a shadow database, and it references a role that does
-- not exist in a fresh shadow DB. Idempotent -- safe to run repeatedly.
-- ============================================================================

BEGIN;

-- ENABLE ROW LEVEL SECURITY and CREATE POLICY each take ACCESS EXCLUSIVE on the
-- table. A blocked ALTER TABLE parks at the head of the lock queue and blocks
-- every read and write behind it. There is normally at least one
-- idle-in-transaction session on this database. So: fail fast and retry rather
-- than stall the live API. If this aborts, clear the blocker --
--   SELECT pid, state, xact_start, query FROM pg_stat_activity
--    WHERE state = 'idle in transaction';
-- -- do NOT raise the timeout.
SET LOCAL lock_timeout = '3s';

-- One transaction for grants + RLS + policies so no table can ever be left
-- RLS-enabled without its policy (that state returns zero rows silently).
-- Applying this is zero-downtime for the currently connected role: postgres
-- both owns all 13 relations and has rolbypassrls = true, so it bypasses the
-- policies by two independent routes.


---------------------------------------------------------------------------
-- B1. Standing assertions. All no-ops against the current catalog
--     (nspacl and every relacl are NULL). Kept because they are the actual
--     control, and re-running this file re-asserts them if someone has since
--     run Supabase's stock "GRANT ALL ... TO anon, authenticated, service_role"
--     snippet against this schema.
---------------------------------------------------------------------------
REVOKE ALL ON SCHEMA sfgc_platform FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA sfgc_platform FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA sfgc_platform FROM anon, authenticated, service_role;
REVOKE ALL ON SCHEMA sfgc_platform FROM anon, authenticated, service_role;


---------------------------------------------------------------------------
-- B2. Schema access.
--     USAGE only. NOT CREATE -- without CREATE the role cannot add a table,
--     a view, or a function to this schema, which is what stops a leaked
--     credential from installing a persistence mechanism.
---------------------------------------------------------------------------
GRANT USAGE ON SCHEMA sfgc_platform TO sfgc_api;


---------------------------------------------------------------------------
-- B3. Table privileges, split by what the code actually does.
--     Verified call-site by call-site across backend/src/routes,
--     prisma/seed.ts, prisma/backfill-classes.ts and scripts/set-password.ts.
--
--     Never granted anywhere: TRUNCATE, REFERENCES, TRIGGER, and any
--     privilege at all on sfgc_platform._prisma_migrations.
--     _prisma_migrations is the one that matters: withholding it is what stops
--     a leaked runtime credential from forging migration history. Prisma
--     Client never touches it; only the migrate CLI does, over DIRECT_URL.
---------------------------------------------------------------------------

-- Tier 1 -- full CRUD. Each of these eight has a live DELETE route:
--   subjects.routes.ts:331, academics.routes.ts:170/310/410/632,
--   materials.routes.ts:179, events.routes.ts:324, notices.routes.ts:271
GRANT SELECT, INSERT, UPDATE, DELETE ON
  sfgc_platform.users,
  sfgc_platform.streams,
  sfgc_platform.class_groups,
  sfgc_platform.periods,
  sfgc_platform.subjects,
  sfgc_platform.events,
  sfgc_platform.notices,
  sfgc_platform.study_materials
  TO sfgc_api;

-- Tier 2 -- no DELETE. Nothing in the codebase ever deletes a row from these
-- three; their rows are removed only by ON DELETE CASCADE from users/subjects/
-- events. Referential-integrity actions run through internal triggers as the
-- OWNER of the referencing table (postgres) with RLS off, so cascades need no
-- privilege from sfgc_api and are unaffected by the policies below --
-- DELETE FROM users still cascades correctly.
--   attendance:      upsert (attendance.routes.ts:297) + createMany
--                    (seed.ts:1042) -> needs INSERT and UPDATE
--   progress_cards:  upsert (progress.routes.ts:286, seed.ts:1069)
--   event_registrations: runtime only creates/reads (events.routes.ts:383),
--                    BUT prisma/seed.ts:1157 uses eventRegistration.upsert,
--                    which compiles to ON CONFLICT DO UPDATE. seed.ts runs on
--                    DATABASE_URL, i.e. as sfgc_api. Withholding UPDATE here
--                    breaks `npm run db:seed` -- hence UPDATE is granted.
GRANT SELECT, INSERT, UPDATE ON
  sfgc_platform.attendance,
  sfgc_platform.progress_cards,
  sfgc_platform.event_registrations
  TO sfgc_api;

-- Tier 3 -- the implicit Prisma m2m join table. Written only via nested
-- `connect` (subjects.routes.ts:369, seed.ts:993/1005), never `set` or
-- `disconnect`, so INSERT is needed and DELETE and UPDATE are not.
-- The double quotes are load-bearing: unquoted, PostgreSQL folds this to
-- _subjectenrollment and every statement errors with "relation does not exist".
GRANT SELECT, INSERT ON sfgc_platform."_SubjectEnrollment" TO sfgc_api;

-- KNOWN TRADE-OFF, recorded so it is a decision and not an accident:
-- adding "unenroll a student", "cancel a registration" or "delete an
-- attendance record" later will fail in production with
--   permission denied for table _SubjectEnrollment
-- until a new GRANT is added. That error is loud and unambiguous; a silent
-- over-grant is not. Also be honest about the size of the win: UPDATE is still
-- held on attendance and progress_cards, so marks can be falsified row by row,
-- and DELETE FROM users cascades away all 3,828 attendance rows regardless.


---------------------------------------------------------------------------
-- B4. Enum types.
--     Redundant today: all five enums have typacl = NULL, i.e. PUBLIC already
--     holds USAGE. Written explicitly so that a future "lock down types" pass
--     running REVOKE USAGE ON TYPE ... FROM PUBLIC does not break every INSERT
--     into users/attendance/notices with "permission denied for type Role",
--     an error that reads like a Prisma bug.
---------------------------------------------------------------------------
GRANT USAGE ON TYPE
  sfgc_platform."Role",
  sfgc_platform."AttendanceStatus",
  sfgc_platform."NoticeAudience",
  sfgc_platform."RegistrationStatus",
  sfgc_platform."MaterialKind"
  TO sfgc_api;


---------------------------------------------------------------------------
-- B5. Default privileges -- SEQUENCES ONLY, and deliberately NOT ON TABLES.
--
--     ON TABLES is omitted on purpose. Do not "helpfully" add it back:
--       (a) it would auto-grant DML on every future table while nothing
--           propagates ENABLE ROW LEVEL SECURITY or the policy -- new tables
--           would land default-open, silently, with no review step;
--       (b) ON TABLES also covers VIEWS. A postgres-owned view without
--           security_invoker=true executes as its owner, which has BYPASSRLS,
--           so an auto-granted convenience view reads straight past every
--           policy on the base tables. That hatch would appear without anyone
--           granting it and would not show up in a table-privilege audit.
--     Instead, every migration that creates a table must emit its own GRANT
--     plus the RLS pair (template in the rollout note). Failure mode of
--     forgetting is a loud "permission denied for table X" on first use.
--
--     SEQUENCES is kept: it grants nothing today (the catalog has zero
--     relations of relkind 'S'; every id is a client-generated cuid), costs
--     nothing, and pre-empts the one genuinely obscure error -- the first
--     @default(autoincrement()) column would otherwise fail at runtime with
--     "permission denied for sequence <t>_<c>_seq", which the ON TABLES
--     default would not have covered either.
--     USAGE, SELECT only -- never UPDATE, which would let the role reset
--     sequence values.
--
--     FOR ROLE postgres is explicit. Without it the default ACL binds to
--     whichever role happened to run the file; if that is ever supabase_admin
--     or a SET ROLE session, the defaults are recorded against the wrong
--     grantor and silently never fire.
---------------------------------------------------------------------------
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA sfgc_platform
  GRANT USAGE, SELECT ON SEQUENCES TO sfgc_api;


---------------------------------------------------------------------------
-- B6. RLS + policies on the twelve application tables.
--
--     Generated from an explicit list via format('%I') rather than hand-
--     expanded, so "_SubjectEnrollment" cannot be mis-quoted and a partial
--     failure cannot leave the schema half-converted.
--
--     _prisma_migrations is intentionally excluded: it has no grant, so it is
--     already unreachable, and RLS there would only add risk to the migrate
--     path for zero benefit.
--
--     FOR ALL is required, not merely convenient: Prisma appends RETURNING to
--     every INSERT/UPDATE/DELETE, and RETURNING additionally requires a SELECT
--     policy. If these are ever split into per-command policies, a FOR SELECT
--     policy covering the same rows MUST be included or every write path
--     breaks while the write policies look correct.
--     SELECT uses USING; INSERT uses WITH CHECK; UPDATE uses both; DELETE uses
--     USING only. All arms are satisfied, including upsert's
--     ON CONFLICT DO UPDATE.
--
--     FORCE ROW LEVEL SECURITY is deliberately NOT set. It only changes
--     behaviour for the table owner, and the owner (postgres) has BYPASSRLS,
--     which outranks FORCE -- so it is a no-op today. Worse, if postgres is
--     ever stripped of BYPASSRLS, FORCE would suddenly apply to it and
--     data-modifying migration statements (e.g.
--     20260819140000_admin_becomes_super_admin) would match zero rows and
--     report success while changing nothing. Leaving FORCE off is what keeps
--     the owner-bypass path working for migrations.
---------------------------------------------------------------------------
DO $$
DECLARE
  t text;
  app_tables constant text[] := ARRAY[
    'users','streams','class_groups','periods','subjects',
    'attendance','progress_cards','events','event_registrations',
    'notices','study_materials','_SubjectEnrollment'
  ];
BEGIN
  FOREACH t IN ARRAY app_tables LOOP
    -- Fail loudly rather than skipping a table if the list drifts from reality.
    IF to_regclass(format('sfgc_platform.%I', t)) IS NULL THEN
      RAISE EXCEPTION 'sfgc_platform.% does not exist -- update this script', t;
    END IF;

    -- Naturally idempotent: re-enabling an already-enabled table is a no-op.
    EXECUTE format('ALTER TABLE sfgc_platform.%I ENABLE ROW LEVEL SECURITY', t);

    -- CREATE POLICY has no IF NOT EXISTS in PG17, so drop-then-create.
    EXECUTE format('DROP POLICY IF EXISTS sfgc_api_all ON sfgc_platform.%I', t);
    EXECUTE format($f$
      CREATE POLICY sfgc_api_all ON sfgc_platform.%I
        FOR ALL TO sfgc_api
        USING (true) WITH CHECK (true)
    $f$, t);
  END LOOP;
END
$$;

COMMIT;

-- Footnote on what RLS does and does not reach here, so nobody re-derives it
-- wrongly later: foreign-key and unique-constraint checks always bypass RLS by
-- design, so cross-table integrity is unaffected. TRUNCATE has no RLS concept
-- at all -- it is gated purely by the TRUNCATE privilege, which is why
-- withholding that privilege in B3 is load-bearing rather than cosmetic.
-- Enabling RLS also makes COPY ... FROM unsupported for sfgc_api; run bulk
-- loads as postgres or use INSERT.


-- ============================================================================
-- PART C -- VERIFICATION. Run as `postgres` after Part B.
-- Every query is written so that ZERO ROWS = correct, except C2/C5/C7 which
-- print an inventory to eyeball against the expected values in the comment.
-- ============================================================================

-- C1. Any application table missing RLS or missing the sfgc_api policy.
--     This is the drift check that matters most, because the failure it
--     catches is SILENT: with RLS on and no matching policy, Postgres injects
--     a constant-false qual, so SELECT/UPDATE/DELETE return zero rows with no
--     error. Prisma then serves empty arrays and P2025 "record not found" --
--     it looks like missing data, not like a permissions bug, and it can
--     survive a smoke test and reach students.
--     EXPECT: 0 rows.
SELECT c.relname AS problem_table,
       c.relrowsecurity AS rls_enabled,
       EXISTS (SELECT 1 FROM pg_policy p
                WHERE p.polrelid = c.oid
                  AND 'sfgc_api'::regrole = ANY (p.polroles)) AS has_sfgc_api_policy
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'sfgc_platform'
  AND c.relkind IN ('r','p')
  AND c.relname <> '_prisma_migrations'
  AND (NOT c.relrowsecurity
       OR NOT EXISTS (SELECT 1 FROM pg_policy p
                       WHERE p.polrelid = c.oid
                         AND 'sfgc_api'::regrole = ANY (p.polroles)));

-- C2. Exact privilege inventory for sfgc_api in sfgc_platform.
--     EXPECT exactly these 12 rows, and no row for _prisma_migrations:
--       _SubjectEnrollment   INSERT,SELECT
--       attendance           INSERT,SELECT,UPDATE
--       class_groups         DELETE,INSERT,SELECT,UPDATE
--       event_registrations  INSERT,SELECT,UPDATE
--       events               DELETE,INSERT,SELECT,UPDATE
--       notices              DELETE,INSERT,SELECT,UPDATE
--       periods              DELETE,INSERT,SELECT,UPDATE
--       progress_cards       INSERT,SELECT,UPDATE
--       streams              DELETE,INSERT,SELECT,UPDATE
--       study_materials      DELETE,INSERT,SELECT,UPDATE
--       subjects             DELETE,INSERT,SELECT,UPDATE
--       users                DELETE,INSERT,SELECT,UPDATE
--     Any TRUNCATE / REFERENCES / TRIGGER appearing here is a defect.
SELECT table_name,
       string_agg(privilege_type, ',' ORDER BY privilege_type) AS privileges
FROM information_schema.table_privileges
WHERE grantee = 'sfgc_api' AND table_schema = 'sfgc_platform'
GROUP BY table_name
ORDER BY table_name;

-- C3. sfgc_api holding privileges anywhere outside sfgc_platform.
--     EXPECT: 0 rows. (USAGE on schema public and CONNECT/TEMP on the database
--     are inherited from PUBLIC and are not table privileges, so they do not
--     appear here -- that is expected and documented in the header.)
SELECT table_schema, table_name, privilege_type
FROM information_schema.table_privileges
WHERE grantee = 'sfgc_api' AND table_schema <> 'sfgc_platform';

-- C4. The four negative invariants, as booleans.
--     EXPECT: t | f | f
SELECT has_schema_privilege('sfgc_api','sfgc_platform','USAGE')  AS usage_expect_TRUE,
       has_schema_privilege('sfgc_api','sfgc_platform','CREATE') AS create_expect_FALSE,
       has_table_privilege('sfgc_api','sfgc_platform._prisma_migrations','SELECT')
                                                                 AS reads_migrations_expect_FALSE;

-- C5. TRUNCATE anywhere in the schema.
--     EXPECT: f
SELECT bool_or(has_table_privilege('sfgc_api', c.oid, 'TRUNCATE')) AS any_truncate_expect_FALSE
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'sfgc_platform' AND c.relkind IN ('r','p');

-- C6. Nobody else has been let into the schema. This is the FIRST layer and
--     the one actually doing the work -- RLS will not save you here, because
--     every role listed except anon/authenticated has BYPASSRLS.
--     EXPECT: 0 rows.
SELECT r.rolname
FROM pg_roles r
WHERE r.rolname IN ('anon','authenticated','service_role',
                    'supabase_read_only_user','supabase_etl_admin','PUBLIC')
  AND has_schema_privilege(r.rolname, 'sfgc_platform', 'USAGE');

-- C7. Role attributes.
--     EXPECT: sfgc_api | f | f | f | f | t | f | NULL
--     rolvaliduntil MUST be NULL or Supavisor's pgbouncer.get_auth() returns
--     NULL and the API cannot authenticate at all.
SELECT rolname, rolsuper, rolbypassrls, rolcreaterole, rolcreatedb,
       rolcanlogin, rolreplication, rolvaliduntil
FROM pg_roles WHERE rolname = 'sfgc_api';

-- C8. Views/matviews that would read past the policies.
--     EXPECT: 0 rows. Any view added to this schema must be created
--     WITH (security_invoker = true); a matview cannot be, so any matview here
--     is by definition an RLS bypass and must be reviewed.
SELECT c.relname, c.relkind, c.reloptions
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'sfgc_platform'
  AND c.relkind IN ('v','m')
  AND (c.reloptions IS NULL OR NOT ('security_invoker=true' = ANY (c.reloptions)));

-- C9. Default ACLs recorded against the right grantor.
--     EXPECT exactly one row:  postgres | S | {sfgc_api=rU/postgres}
--     A row with defaclobjtype 'r' means someone re-added ON TABLES -- see B5.
--     A grantor other than postgres means the file was run from the wrong role
--     and the defaults will never fire.
SELECT defaclrole::regrole AS grantor, defaclobjtype, defaclacl
FROM pg_default_acl
WHERE defaclnamespace = 'sfgc_platform'::regnamespace;
