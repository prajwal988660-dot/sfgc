-- A counter for student codes, and the missing index on attendance.markedById.
--
-- Additive: one new table, one new index. No existing row or column is touched.
-- The index is created non-concurrently because the table holds ~4k rows today;
-- at millions it would want CREATE INDEX CONCURRENTLY outside a transaction.

-- CreateTable
CREATE TABLE "student_code_counters" (
    "prefix" TEXT NOT NULL,
    "seq" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "student_code_counters_pkey" PRIMARY KEY ("prefix")
);

-- CreateIndex
CREATE INDEX "attendance_markedById_idx" ON "attendance"("markedById");

