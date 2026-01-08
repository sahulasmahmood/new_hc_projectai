/*
  Warnings:

  - You are about to drop the column `serviceId` on the `BillItem` table. All the data in the column will be lost.
  - You are about to drop the `Service` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "BillItem" DROP CONSTRAINT "BillItem_serviceId_fkey";

-- DropIndex
DROP INDEX "BillItem_serviceId_idx";

-- AlterTable
ALTER TABLE "BillItem" DROP COLUMN "serviceId";

-- DropTable
DROP TABLE "Service";
