-- CreateTable
CREATE TABLE "AppointmentSettings" (
    "id" SERIAL NOT NULL,
    "timeSlots" TEXT[],
    "durations" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppointmentSettings_pkey" PRIMARY KEY ("id")
);
