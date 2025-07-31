-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "patientId" INTEGER;

-- CreateTable
CREATE TABLE "Patient" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "age" INTEGER NOT NULL,
    "gender" VARCHAR(20) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "email" VARCHAR(100),
    "condition" VARCHAR(200),
    "status" VARCHAR(50) NOT NULL DEFAULT 'Active',
    "allergies" TEXT[],
    "lastVisit" TIMESTAMP(3),
    "abhaId" VARCHAR(50),
    "abhaVerified" BOOLEAN NOT NULL DEFAULT false,
    "emergencyContact" VARCHAR(100),
    "emergencyPhone" VARCHAR(20),
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Patient_abhaId_key" ON "Patient"("abhaId");

-- CreateIndex
CREATE INDEX "Appointment_patientId_idx" ON "Appointment"("patientId");

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;
