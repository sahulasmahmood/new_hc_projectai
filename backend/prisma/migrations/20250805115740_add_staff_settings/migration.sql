-- CreateTable
CREATE TABLE "StaffSettings" (
    "id" SERIAL NOT NULL,
    "roles" TEXT[],
    "departments" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffSettings_pkey" PRIMARY KEY ("id")
);
