-- Add unique constraint to prevent duplicate vitals for same patient/appointment
-- First, remove any existing duplicates (keep the most recent one)
WITH ranked_vitals AS (
  SELECT id, 
         ROW_NUMBER() OVER (PARTITION BY "patientId", "appointmentId" ORDER BY "updatedAt" DESC) as rn
  FROM "PatientVitals"
)
DELETE FROM "PatientVitals" 
WHERE id IN (
  SELECT id FROM ranked_vitals WHERE rn > 1
);

-- Add the unique constraint
ALTER TABLE "PatientVitals" ADD CONSTRAINT "PatientVitals_patientId_appointmentId_key" UNIQUE ("patientId", "appointmentId");