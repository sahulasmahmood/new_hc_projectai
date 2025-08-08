/*
  Warnings:

  - You are about to drop the column `department` on the `Staff` table. All the data in the column will be lost.
  - You are about to drop the `StaffSettings` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "Staff" DROP COLUMN "department",
ADD COLUMN     "departmentId" INTEGER;

-- DropTable
DROP TABLE "StaffSettings";

-- CreateTable
CREATE TABLE "Department" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shift" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "departmentId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" SERIAL NOT NULL,
    "role" TEXT NOT NULL,
    "permissions" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Department_name_key" ON "Department"("name");

-- CreateIndex
CREATE INDEX "Shift_departmentId_idx" ON "Shift"("departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_role_key" ON "RolePermission"("role");

-- CreateIndex
CREATE INDEX "Staff_departmentId_idx" ON "Staff"("departmentId");

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;
