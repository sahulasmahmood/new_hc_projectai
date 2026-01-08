/*
  Warnings:

  - You are about to drop the column `gstRateId` on the `BillItem` table. All the data in the column will be lost.
  - You are about to drop the `GSTRate` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "BillItem" DROP CONSTRAINT "BillItem_gstRateId_fkey";

-- DropIndex
DROP INDEX "BillItem_gstRateId_idx";

-- AlterTable
ALTER TABLE "BillItem" DROP COLUMN "gstRateId";

-- DropTable
DROP TABLE "GSTRate";
