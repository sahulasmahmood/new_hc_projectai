/*
  Warnings:

  - You are about to drop the column `gstEnabled` on the `Bill` table. All the data in the column will be lost.
  - You are about to drop the column `gstRate` on the `Bill` table. All the data in the column will be lost.
  - You are about to drop the column `gstApplicable` on the `BillItem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Bill" DROP COLUMN "gstEnabled",
DROP COLUMN "gstRate";

-- AlterTable
ALTER TABLE "BillItem" DROP COLUMN "gstApplicable",
ADD COLUMN     "gstAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "gstRateId" INTEGER;

-- CreateTable
CREATE TABLE "GstRate" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GstRate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GstRate_name_key" ON "GstRate"("name");

-- CreateIndex
CREATE INDEX "BillItem_gstRateId_idx" ON "BillItem"("gstRateId");

-- AddForeignKey
ALTER TABLE "BillItem" ADD CONSTRAINT "BillItem_gstRateId_fkey" FOREIGN KEY ("gstRateId") REFERENCES "GstRate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
