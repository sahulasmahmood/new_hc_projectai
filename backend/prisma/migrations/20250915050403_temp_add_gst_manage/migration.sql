-- AlterTable
ALTER TABLE "BillItem" ADD COLUMN     "gstRateId" INTEGER;

-- CreateTable
CREATE TABLE "GSTRate" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GSTRate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GSTRate_name_key" ON "GSTRate"("name");

-- CreateIndex
CREATE INDEX "BillItem_gstRateId_idx" ON "BillItem"("gstRateId");

-- AddForeignKey
ALTER TABLE "BillItem" ADD CONSTRAINT "BillItem_gstRateId_fkey" FOREIGN KEY ("gstRateId") REFERENCES "GSTRate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
