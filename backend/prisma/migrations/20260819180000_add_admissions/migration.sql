-- Admission applications and their attached documents.
--
-- Additive: two enums, two new tables, three indexes, three foreign keys.
-- No existing table is altered, so this is safe against the running system.
-- `admissions` is the only table an anonymous request may insert into; see
-- src/routes/admissions.routes.ts for the limits that surround that.

-- CreateEnum
CREATE TYPE "AdmissionStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'DOCUMENTS_REQUESTED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN', 'ENROLLED');

-- CreateEnum
CREATE TYPE "AdmissionDocumentKind" AS ENUM ('MARKS_CARD', 'TRANSFER_CERTIFICATE', 'MIGRATION_CERTIFICATE', 'ID_PROOF', 'PHOTO', 'CASTE_CERTIFICATE', 'OTHER');

-- CreateTable
CREATE TABLE "admissions" (
    "id" TEXT NOT NULL,
    "applicationNo" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "dateOfBirth" DATE,
    "address" TEXT,
    "guardianName" TEXT,
    "guardianPhone" TEXT,
    "streamId" TEXT,
    "programmeName" TEXT NOT NULL,
    "qualifyingExam" TEXT,
    "boardUniversity" TEXT,
    "yearOfPassing" INTEGER,
    "marksObtained" TEXT,
    "status" "AdmissionStatus" NOT NULL DEFAULT 'SUBMITTED',
    "reviewNotes" TEXT,
    "reviewedById" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admission_documents" (
    "id" TEXT NOT NULL,
    "admissionId" TEXT NOT NULL,
    "kind" "AdmissionDocumentKind" NOT NULL DEFAULT 'OTHER',
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admission_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admissions_applicationNo_key" ON "admissions"("applicationNo");

-- CreateIndex
CREATE INDEX "admissions_status_createdAt_idx" ON "admissions"("status", "createdAt");

-- CreateIndex
CREATE INDEX "admissions_email_idx" ON "admissions"("email");

-- CreateIndex
CREATE INDEX "admission_documents_admissionId_idx" ON "admission_documents"("admissionId");

-- AddForeignKey
ALTER TABLE "admissions" ADD CONSTRAINT "admissions_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES "streams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admissions" ADD CONSTRAINT "admissions_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_documents" ADD CONSTRAINT "admission_documents_admissionId_fkey" FOREIGN KEY ("admissionId") REFERENCES "admissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

