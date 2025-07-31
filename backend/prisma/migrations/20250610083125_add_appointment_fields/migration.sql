/*
  Warnings:

  - Added the required column `patientPhone` to the `Appointment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "duration" TEXT NOT NULL DEFAULT '30',
ADD COLUMN     "patientPhone" TEXT NOT NULL,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'Consultation',
ALTER COLUMN "status" SET DEFAULT 'Pending';
