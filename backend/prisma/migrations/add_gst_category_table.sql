-- CreateTable
CREATE TABLE "GstCategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GstCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GstCategory_name_key" ON "GstCategory"("name");

-- AlterTable
ALTER TABLE "GstRate" ADD COLUMN "categoryId" INTEGER;

-- CreateIndex
CREATE INDEX "GstRate_categoryId_idx" ON "GstRate"("categoryId");

-- AddForeignKey
ALTER TABLE "GstRate" ADD CONSTRAINT "GstRate_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "GstCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Insert default GST categories
INSERT INTO "GstCategory" ("name", "description", "isActive", "createdAt", "updatedAt") VALUES
('Medicine', 'Pharmaceutical products and medicines (typically 5% GST)', true, NOW(), NOW()),
('Cosmetic', 'Cosmetic and beauty products (typically 18% GST)', true, NOW(), NOW()),
('Consultation', 'Medical consultation and professional services (typically 18% GST)', true, NOW(), NOW()),
('Lab Test', 'Laboratory tests and diagnostic services (typically 5% or 18% GST)', true, NOW(), NOW()),
('Equipment', 'Medical equipment and devices (typically 18% GST)', true, NOW(), NOW()),
('Service', 'General healthcare services (typically 18% GST)', true, NOW(), NOW()),
('Emergency', 'Emergency medical services (typically 5% GST)', true, NOW(), NOW()),
('Procedure', 'Medical procedures and treatments (typically 5% or 18% GST)', true, NOW(), NOW());