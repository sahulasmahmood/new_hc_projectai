/*
  Warnings:

  - A unique constraint covering the columns `[employeeId]` on the table `Staff` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Staff" ADD COLUMN     "avatar" TEXT,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "dateOfHiring" TIMESTAMP(3),
ADD COLUMN     "documents" TEXT[],
ADD COLUMN     "employeeId" VARCHAR(50),
ADD COLUMN     "firstName" VARCHAR(50),
ADD COLUMN     "gender" VARCHAR(10),
ADD COLUMN     "lastName" VARCHAR(50),
ADD COLUMN     "shiftId" INTEGER,
ADD COLUMN     "weekOff" VARCHAR(20);

-- CreateIndex
CREATE UNIQUE INDEX "Staff_employeeId_key" ON "Staff"("employeeId");

-- CreateIndex
CREATE INDEX "Staff_shiftId_idx" ON "Staff"("shiftId");

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE SET NULL ON UPDATE CASCADE;
