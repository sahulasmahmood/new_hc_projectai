-- Migration: Add GST Category Table
-- This migration adds a separate GstCategory table and updates GstRate to use foreign key relationship

-- Step 1: Create GstCategory table
CREATE TABLE IF NOT EXISTS "GstCategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GstCategory_pkey" PRIMARY KEY ("id")
);

-- Step 2: Create unique index on name
CREATE UNIQUE INDEX IF NOT EXISTS "GstCategory_name_key" ON "GstCategory"("name");

-- Step 3: Add categoryId column to GstRate table (if it doesn't exist)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='GstRate' AND column_name='categoryId') THEN
        ALTER TABLE "GstRate" ADD COLUMN "categoryId" INTEGER;
    END IF;
END $$;

-- Step 4: Create index on categoryId
CREATE INDEX IF NOT EXISTS "GstRate_categoryId_idx" ON "GstRate"("categoryId");

-- Step 5: Add foreign key constraint (if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='GstRate_categoryId_fkey') THEN
        ALTER TABLE "GstRate" ADD CONSTRAINT "GstRate_categoryId_fkey" 
        FOREIGN KEY ("categoryId") REFERENCES "GstCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Step 6: Insert default GST categories (only if they don't exist)
INSERT INTO "GstCategory" ("name", "description", "isActive", "createdAt", "updatedAt") 
SELECT * FROM (VALUES
    ('Medicine', 'Pharmaceutical products and medicines (typically 5% GST)', true, NOW(), NOW()),
    ('Cosmetic', 'Cosmetic and beauty products (typically 18% GST)', true, NOW(), NOW()),
    ('Consultation', 'Medical consultation and professional services (typically 18% GST)', true, NOW(), NOW()),
    ('Lab Test', 'Laboratory tests and diagnostic services (typically 5% or 18% GST)', true, NOW(), NOW()),
    ('Equipment', 'Medical equipment and devices (typically 18% GST)', true, NOW(), NOW()),
    ('Service', 'General healthcare services (typically 18% GST)', true, NOW(), NOW()),
    ('Emergency', 'Emergency medical services (typically 5% GST)', true, NOW(), NOW()),
    ('Procedure', 'Medical procedures and treatments (typically 5% or 18% GST)', true, NOW(), NOW())
) AS v(name, description, isActive, createdAt, updatedAt)
WHERE NOT EXISTS (SELECT 1 FROM "GstCategory" WHERE "GstCategory"."name" = v.name);

-- Step 7: Migrate existing GST rates with string categories to use categoryId
-- This will match existing string categories to the new category IDs
UPDATE "GstRate" 
SET "categoryId" = "GstCategory"."id"
FROM "GstCategory"
WHERE "GstRate"."category" IS NOT NULL 
  AND "GstRate"."categoryId" IS NULL
  AND LOWER("GstRate"."category") = LOWER("GstCategory"."name");

-- Step 8: Create categories for any remaining unmapped string categories
INSERT INTO "GstCategory" ("name", "description", "isActive", "createdAt", "updatedAt")
SELECT DISTINCT 
    INITCAP("category") as name,
    INITCAP("category") || ' category' as description,
    true as isActive,
    NOW() as createdAt,
    NOW() as updatedAt
FROM "GstRate" 
WHERE "category" IS NOT NULL 
  AND "categoryId" IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM "GstCategory" 
    WHERE LOWER("GstCategory"."name") = LOWER("GstRate"."category")
  );

-- Step 9: Update any remaining GST rates that still don't have categoryId
UPDATE "GstRate" 
SET "categoryId" = "GstCategory"."id"
FROM "GstCategory"
WHERE "GstRate"."category" IS NOT NULL 
  AND "GstRate"."categoryId" IS NULL
  AND LOWER("GstRate"."category") = LOWER("GstCategory"."name");

-- Migration completed
-- You can now optionally remove the old "category" string column from GstRate table
-- ALTER TABLE "GstRate" DROP COLUMN "category";