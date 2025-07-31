/*
  Warnings:

  - You are about to drop the column `medicalReportFile` on the `Patient` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Patient" DROP COLUMN "medicalReportFile";

-- CreateTable
CREATE TABLE "MedicalReport" (
    "id" SERIAL NOT NULL,
    "filePath" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "patientId" INTEGER NOT NULL,
    "description" TEXT,

    CONSTRAINT "MedicalReport_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MedicalReport" ADD CONSTRAINT "MedicalReport_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
