-- AlterTable
ALTER TABLE "EmergencyCase" ADD COLUMN     "transferNotes" TEXT,
ADD COLUMN     "transferReason" TEXT,
ADD COLUMN     "transferStatus" TEXT NOT NULL DEFAULT 'Not Transferred',
ADD COLUMN     "transferTime" TIMESTAMP(3),
ADD COLUMN     "transferTo" TEXT;
