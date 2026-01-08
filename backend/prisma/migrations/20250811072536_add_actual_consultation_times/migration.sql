-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "actualEndTime" TIMESTAMP(3),
ADD COLUMN     "actualStartTime" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Patient" ADD COLUMN     "actualConsultationStartTime" TIMESTAMP(3);
