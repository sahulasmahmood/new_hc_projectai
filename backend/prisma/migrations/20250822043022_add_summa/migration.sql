-- AlterTable
ALTER TABLE "Prescription" ADD COLUMN     "patientAge" INTEGER,
ADD COLUMN     "patientGender" TEXT,
ADD COLUMN     "patientName" TEXT,
ADD COLUMN     "patientVisibleId" TEXT,
ALTER COLUMN "doctorName" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Staff" ADD COLUMN     "digitalSignature" TEXT;
