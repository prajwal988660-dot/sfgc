-- Widen the Role enum from three roles to five.
--
-- ADDITIVE ONLY. No row changes here, and ADMIN is deliberately left in place.
--
-- Renaming ADMIN to SUPER_ADMIN in the same step would lock the administrator
-- out: the deployed API compares against the literal 'ADMIN', so the moment the
-- column said SUPER_ADMIN the only admin account would fail every staff check
-- until a new build reached Render. The move is therefore three separate steps —
-- add the values (here), ship a build that accepts both, and only then migrate
-- the rows. This migration is safe to apply against the running system.
--
-- Postgres cannot remove an enum value in place, so retiring ADMIN afterwards
-- means creating a replacement type and swapping the column over. That is a
-- later migration, once nothing reads ADMIN any more.
--
-- Separate statements rather than one: ALTER TYPE ... ADD VALUE may not be used
-- within the same transaction that adds it, which is why nothing below writes a
-- row using these values.

ALTER TYPE "Role" ADD VALUE 'CONTENT_ADMIN';
ALTER TYPE "Role" ADD VALUE 'ADMISSIONS_OFFICER';
ALTER TYPE "Role" ADD VALUE 'SUPER_ADMIN';
