-- CreateTable
CREATE TABLE "EmailConfiguration" (
    "id" SERIAL NOT NULL,
    "smtpPort" TEXT NOT NULL,
    "smtpUsername" TEXT NOT NULL,
    "smtpPassword" TEXT NOT NULL,
    "senderEmail" TEXT NOT NULL,
    "smtpHost" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailConfiguration_pkey" PRIMARY KEY ("id")
);
