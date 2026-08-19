-- Move the administrator account from the deprecated ADMIN role to SUPER_ADMIN.
--
-- Third of three steps. The first added the new enum values; the second shipped
-- code — API and clients — that treats both names identically. Only now can the
-- rows move without locking anyone out, because every reader already understands
-- the new name.
--
-- Safe with respect to sessions: middleware/auth.ts re-reads the role from the
-- database on every request rather than trusting the role claim in the JWT, so
-- this takes effect immediately for tokens already issued. Nobody is signed out
-- and nothing needs revoking.
--
-- ADMIN stays in the enum. Postgres cannot drop a value in place, so retiring it
-- means building a replacement type and swapping the column over — a separate
-- migration, once no code path references the old name at all.

UPDATE "users" SET "role" = 'SUPER_ADMIN' WHERE "role" = 'ADMIN';
