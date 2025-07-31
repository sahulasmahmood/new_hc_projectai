/*
  Warnings:

  - You are about to drop the `InventoryBatch` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "InventoryBatch" DROP CONSTRAINT "InventoryBatch_inventoryItemId_fkey";

-- AlterTable
ALTER TABLE "InventoryItem" ADD COLUMN     "batchNumber" TEXT;

-- DropTable
DROP TABLE "InventoryBatch";
