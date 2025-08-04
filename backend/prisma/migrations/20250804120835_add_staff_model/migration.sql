-- CreateTable
CREATE TABLE "Staff" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "role" VARCHAR(50) NOT NULL,
    "department" VARCHAR(50) NOT NULL,
    "qualification" TEXT,
    "experience" TEXT,
    "phone" VARCHAR(20),
    "email" VARCHAR(100),
    "status" VARCHAR(20) NOT NULL DEFAULT 'On Duty',
    "shift" VARCHAR(20),
    "consultationFee" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);
