/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `InventoryBatch` table. All the data in the column will be lost.
  - You are about to drop the column `usedQuantity` on the `InventoryBatch` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "InventoryBatch" DROP COLUMN "updatedAt",
DROP COLUMN "usedQuantity";

-- AlterTable
ALTER TABLE "InventoryItem" ADD COLUMN     "expiryDate" TIMESTAMP(3);
