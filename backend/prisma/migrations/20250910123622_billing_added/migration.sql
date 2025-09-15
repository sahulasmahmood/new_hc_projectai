-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('UPI', 'Credit_Card', 'Cash');

-- CreateTable
CREATE TABLE "Bill" (
    "id" VARCHAR(20) NOT NULL,
    "patientId" INTEGER NOT NULL,
    "patientName" VARCHAR(255) NOT NULL,
    "appointmentId" INTEGER,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" DECIMAL(10,2) NOT NULL,
    "gstAmount" DECIMAL(10,2) NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "services" JSONB NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bill_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Bill_patientId_idx" ON "Bill"("patientId");

-- CreateIndex
CREATE INDEX "Bill_appointmentId_idx" ON "Bill"("appointmentId");

-- CreateIndex
CREATE INDEX "Bill_date_idx" ON "Bill"("date");

-- CreateIndex
CREATE INDEX "Bill_paymentMethod_idx" ON "Bill"("paymentMethod");

-- AddForeignKey
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
