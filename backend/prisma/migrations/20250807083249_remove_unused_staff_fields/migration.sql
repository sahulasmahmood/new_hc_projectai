/*
  Warnings:

  - You are about to drop the column `avatar` on the `Staff` table. All the data in the column will be lost.
  - You are about to drop the column `firstName` on the `Staff` table. All the data in the column will be lost.
  - You are about to drop the column `lastName` on the `Staff` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Staff" DROP COLUMN "avatar",
DROP COLUMN "firstName",
DROP COLUMN "lastName";
