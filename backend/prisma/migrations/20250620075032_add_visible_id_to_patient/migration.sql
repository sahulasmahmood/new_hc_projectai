/*
  Warnings:

  - A unique constraint covering the columns `[visibleId]` on the table `Patient` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `visibleId` to the `Patient` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Patient" ADD COLUMN     "visibleId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Patient_visibleId_key" ON "Patient"("visibleId");
