-- Migration: Add Staff Status Log Table
-- Purpose: Track all status changes for audit and compliance

-- Create StaffStatusLog table
CREATE TABLE IF NOT EXISTS "StaffStatusLog" (
  "id" SERIAL PRIMARY KEY,
  "staffId" INTEGER NOT NULL,
  "previousStatus" VARCHAR(50),
  "newStatus" VARCHAR(50) NOT NULL,
  "changeType" VARCHAR(20) NOT NULL CHECK ("changeType" IN ('automatic', 'manual')),
  "changedBy" VARCHAR(100),
  "reason" TEXT,
  "timestamp" TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT "fk_staff_status_log_staff" 
    FOREIGN KEY ("staffId") 
    REFERENCES "Staff"("id") 
    ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "idx_staff_status_log_staffId" ON "StaffStatusLog"("staffId");
CREATE INDEX IF NOT EXISTS "idx_staff_status_log_timestamp" ON "StaffStatusLog"("timestamp");
CREATE INDEX IF NOT EXISTS "idx_staff_status_log_changeType" ON "StaffStatusLog"("changeType");

-- Composite index for cleanup operations (performance optimization)
CREATE INDEX IF NOT EXISTS "idx_staff_status_log_cleanup" ON "StaffStatusLog"("timestamp", "changeType");

-- Composite index for staff history queries (performance optimization)
CREATE INDEX IF NOT EXISTS "idx_staff_status_log_staff_time" ON "StaffStatusLog"("staffId", "timestamp" DESC);

-- Add comment to table
COMMENT ON TABLE "StaffStatusLog" IS 'Audit log for all staff status changes (automatic and manual) - optimized for large scale';
COMMENT ON COLUMN "StaffStatusLog"."changeType" IS 'Type of change: automatic (system) or manual (user)';
COMMENT ON COLUMN "StaffStatusLog"."changedBy" IS 'User who made the change (null for automatic changes)';
