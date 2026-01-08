const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

/**
 * Initialize default vitals settings based on healthcare standards
 * These ranges follow WHO and standard medical guidelines
 */
const initializeDefaultVitalsSettings = async () => {
  try {
    const defaultVitalsSettings = [
      {
        vitalType: 'bloodPressureSys',
        name: 'Blood Pressure (Systolic)',
        unit: 'mmHg',
        minNormal: 90,
        maxNormal: 120,
        minCritical: 70,
        maxCritical: 180,
        isActive: true,
        notes: 'Normal range for adults. Hypertension if ≥140 mmHg, Hypotension if <90 mmHg'
      },
      {
        vitalType: 'bloodPressureDia',
        name: 'Blood Pressure (Diastolic)',
        unit: 'mmHg',
        minNormal: 60,
        maxNormal: 80,
        minCritical: 40,
        maxCritical: 120,
        isActive: true,
        notes: 'Normal range for adults. Hypertension if ≥90 mmHg, Hypotension if <60 mmHg'
      },
      {
        vitalType: 'heartRate',
        name: 'Heart Rate',
        unit: 'bpm',
        minNormal: 60,
        maxNormal: 100,
        minCritical: 40,
        maxCritical: 150,
        isActive: true,
        notes: 'Normal resting heart rate for adults. Bradycardia if <60 bpm, Tachycardia if >100 bpm'
      },
      {
        vitalType: 'temperature',
        name: 'Body Temperature',
        unit: '°F',
        minNormal: 97.0,
        maxNormal: 99.0,
        minCritical: 94.0,
        maxCritical: 106.0,
        isActive: true,
        notes: 'Normal body temperature range. Fever if >100.4°F (38°C), Hypothermia if <95°F (35°C). Critical: <94°F or >106°F'
      },
      {
        vitalType: 'respiratoryRate',
        name: 'Respiratory Rate',
        unit: '/min',
        minNormal: 12,
        maxNormal: 20,
        minCritical: 8,
        maxCritical: 30,
        isActive: true,
        notes: 'Normal breathing rate for adults at rest. Bradypnea if <12/min, Tachypnea if >20/min'
      },
      {
        vitalType: 'oxygenSaturation',
        name: 'Oxygen Saturation (SpO2)',
        unit: '%',
        minNormal: 95,
        maxNormal: 100,
        minCritical: 85,
        maxCritical: 100,
        isActive: true,
        notes: 'Normal oxygen saturation. Hypoxemia if <95%, Critical if <90%'
      },
      {
        vitalType: 'weight',
        name: 'Weight',
        unit: 'lbs',
        minNormal: null,
        maxNormal: null,
        minCritical: null,
        maxCritical: null,
        isActive: true,
        notes: 'Body weight measurement. Normal range varies by age, height, and body composition'
      },
      {
        vitalType: 'height',
        name: 'Height',
        unit: 'inches',
        minNormal: null,
        maxNormal: null,
        minCritical: null,
        maxCritical: null,
        isActive: true,
        notes: 'Body height measurement. Used for BMI calculation and dosage adjustments'
      }
    ];

    for (const setting of defaultVitalsSettings) {
      await prisma.vitalsSettings.upsert({
        where: { vitalType: setting.vitalType },
        update: {}, // Don't update if exists
        create: setting
      });
    }

    console.log('✅ Default vitals settings initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing default vitals settings:', error);
    throw error;
  }
};

module.exports = { initializeDefaultVitalsSettings };
