-- Initialise the student-code counters from the codes already issued.
--
-- Without this the counter starts at 0 and the next student created is offered
-- BCA25001 — which an existing student already holds — so the insert fails on
-- users_studentCode_key. The counter has to begin where the old scan-based
-- generator left off.
--
-- A code is <prefix><3 digits>, e.g. BCA25001 -> prefix BCA25, seq 1. Rows that
-- do not match that shape are ignored rather than guessed at.

INSERT INTO "student_code_counters" ("prefix", "seq")
SELECT
  substring("studentCode" from 1 for length("studentCode") - 3) AS prefix,
  MAX(CAST(right("studentCode", 3) AS INTEGER))                 AS seq
FROM "users"
WHERE "studentCode" IS NOT NULL
  AND "studentCode" ~ '^[A-Z]+[0-9]{2}[0-9]{3}$'
GROUP BY 1
-- GREATEST, not overwrite: re-running must never lower a counter and hand out
-- a code that is already in use.
ON CONFLICT ("prefix") DO UPDATE
  SET "seq" = GREATEST("student_code_counters"."seq", EXCLUDED."seq");
