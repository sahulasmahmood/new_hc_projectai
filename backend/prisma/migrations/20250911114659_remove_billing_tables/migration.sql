/*
  Warnings:

  - You are about to drop the `Bill` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `BillItem` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Bill" DROP CONSTRAINT "Bill_doctorId_fkey";

-- DropForeignKey
ALTER TABLE "Bill" DROP CONSTRAINT "Bill_patientId_fkey";

-- DropForeignKey
ALTER TABLE "BillItem" DROP CONSTRAINT "BillItem_billId_fkey";

-- DropTable
DROP TABLE "Bill";

-- DropTable
DROP TABLE "BillItem";

-- DropEnum
DROP TYPE "BillStatus";

-- DropEnum
DROP TYPE "ItemType";

-- DropEnum
DROP TYPE "PaymentMode";
