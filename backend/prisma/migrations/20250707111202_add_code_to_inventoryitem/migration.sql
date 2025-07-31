/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `InventoryItem` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `InventoryItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "InventoryItem" ADD COLUMN     "code" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "InventoryItem_code_key" ON "InventoryItem"("code");
