/*
  Warnings:

  - Added the required column `breakEnd` to the `AppointmentSettings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `breakStart` to the `AppointmentSettings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `workingHoursEnd` to the `AppointmentSettings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `workingHoursStart` to the `AppointmentSettings` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `timeSlots` on the `AppointmentSettings` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "AppointmentSettings" ADD COLUMN     "advanceBookingDays" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "allowOverlapping" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "appointmentTypes" TEXT[],
ADD COLUMN     "autoGenerateSlots" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "breakEnd" TEXT NOT NULL,
ADD COLUMN     "breakStart" TEXT NOT NULL,
ADD COLUMN     "bufferTime" INTEGER NOT NULL DEFAULT 15,
ADD COLUMN     "defaultDuration" TEXT NOT NULL DEFAULT '30',
ADD COLUMN     "maxAppointmentsPerDay" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN     "workingHoursEnd" TEXT NOT NULL,
ADD COLUMN     "workingHoursStart" TEXT NOT NULL,
DROP COLUMN "timeSlots",
ADD COLUMN     "timeSlots" JSONB NOT NULL;
