/*
  Warnings:

  - You are about to drop the column `departmentId` on the `Shift` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Shift" DROP CONSTRAINT "Shift_departmentId_fkey";

-- DropIndex
DROP INDEX "Shift_departmentId_idx";

-- AlterTable
ALTER TABLE "Shift" DROP COLUMN "departmentId";
