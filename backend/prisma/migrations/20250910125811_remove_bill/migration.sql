/*
  Warnings:

  - You are about to drop the `Bill` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Bill" DROP CONSTRAINT "Bill_appointmentId_fkey";

-- DropForeignKey
ALTER TABLE "Bill" DROP CONSTRAINT "Bill_patientId_fkey";

-- DropTable
DROP TABLE "Bill";

-- DropEnum
DROP TYPE "PaymentMethod";
