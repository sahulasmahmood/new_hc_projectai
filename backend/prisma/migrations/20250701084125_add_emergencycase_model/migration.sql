-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "emergencyCaseId" INTEGER;

-- CreateTable
CREATE TABLE "EmergencyCase" (
    "id" SERIAL NOT NULL,
    "patientId" INTEGER NOT NULL,
    "chiefComplaint" TEXT NOT NULL,
    "arrivalTime" TIMESTAMP(3) NOT NULL,
    "triagePriority" TEXT NOT NULL,
    "assignedTo" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "vitals" JSONB NOT NULL,
    "appointmentId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmergencyCase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmergencyCase_appointmentId_key" ON "EmergencyCase"("appointmentId");

-- CreateIndex
CREATE INDEX "EmergencyCase_patientId_idx" ON "EmergencyCase"("patientId");

-- CreateIndex
CREATE INDEX "EmergencyCase_appointmentId_idx" ON "EmergencyCase"("appointmentId");

-- AddForeignKey
ALTER TABLE "EmergencyCase" ADD CONSTRAINT "EmergencyCase_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencyCase" ADD CONSTRAINT "EmergencyCase_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
