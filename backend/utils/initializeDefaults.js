const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

// Default data for initial setup
const DEFAULT_ROLES = [
    { role: 'Doctor', permissions: [] },
    { role: 'Nurse', permissions: [] }
];

const DEFAULT_DEPARTMENTS = [
    { name: 'General' },
    { name: 'Nursing' },
    { name: 'Administration' },
    { name: 'Support Staff' },
    { name: 'Other' }
];

const DEFAULT_GST_CATEGORIES = [
    { name: 'Medicine', description: 'Pharmaceutical products and medicines (typically 5% GST)' },
    { name: 'Cosmetic', description: 'Cosmetic and beauty products (typically 18% GST)' },
    { name: 'Consultation', description: 'Medical consultation and professional services (typically 18% GST)' },
    { name: 'Lab Test', description: 'Laboratory tests and diagnostic services (typically 5% or 18% GST)' },
    { name: 'Equipment', description: 'Medical equipment and devices (typically 18% GST)' },
    { name: 'Service', description: 'General healthcare services (typically 18% GST)' },
    { name: 'Emergency', description: 'Emergency medical services (typically 5% GST)' },
    { name: 'Procedure', description: 'Medical procedures and treatments (typically 5% or 18% GST)' }
];

const DEFAULT_VITALS_SETTINGS = [
    {
        vitalType: 'bloodPressure',
        name: 'Blood Pressure',
        unit: 'mmHg',
        minNormal: 90,
        maxNormal: 140,
        minCritical: 60,
        maxCritical: 180,
        notes: 'Systolic pressure range'
    },
    {
        vitalType: 'heartRate',
        name: 'Heart Rate',
        unit: 'bpm',
        minNormal: 60,
        maxNormal: 100,
        minCritical: 40,
        maxCritical: 150,
        notes: 'Resting heart rate'
    },
    {
        vitalType: 'temperature',
        name: 'Temperature',
        unit: '°F',
        minNormal: 97.0,
        maxNormal: 99.0,
        minCritical: 95.0,
        maxCritical: 104.0,
        notes: 'Body temperature'
    },
    {
        vitalType: 'respiratoryRate',
        name: 'Respiratory Rate',
        unit: '/min',
        minNormal: 12,
        maxNormal: 20,
        minCritical: 8,
        maxCritical: 30,
        notes: 'Breaths per minute'
    },
    {
        vitalType: 'oxygenSaturation',
        name: 'Oxygen Saturation',
        unit: '%',
        minNormal: 95,
        maxNormal: 100,
        minCritical: 85,
        maxCritical: 100,
        notes: 'Blood oxygen saturation'
    }
];

/**
 * Check if this is a fresh database (first time setup)
 * We consider it fresh if there are no roles, departments, or GST categories
 */
async function isDatabaseFresh() {
    try {
        const [roleCount, deptCount, gstCatCount] = await Promise.all([
            prisma.rolePermission.count(),
            prisma.department.count(),
            prisma.gstCategory.count().catch(() => 0) // GST categories might not exist yet
        ]);

        // Database is fresh if all core tables are empty
        return roleCount === 0 && deptCount === 0 && gstCatCount === 0;
    } catch (error) {
        console.log('Error checking database freshness:', error.message);
        // If we can't check, assume it's fresh to be safe
        return true;
    }
}

/**
 * Initialize default roles (only on fresh database)
 */
async function initializeRoles() {
    try {
        console.log('Creating default roles...');

        for (const defaultRole of DEFAULT_ROLES) {
            await prisma.rolePermission.create({
                data: {
                    role: defaultRole.role,
                    permissions: defaultRole.permissions
                }
            });
            console.log(`✓ Created role: ${defaultRole.role}`);
        }

        return { success: true };
    } catch (error) {
        console.error('Error creating default roles:', error);
        return { success: false, error };
    }
}

/**
 * Initialize default departments (only on fresh database)
 */
async function initializeDepartments() {
    try {
        console.log('Creating default departments...');

        for (const defaultDept of DEFAULT_DEPARTMENTS) {
            await prisma.department.create({
                data: { name: defaultDept.name }
            });
            console.log(`✓ Created department: ${defaultDept.name}`);
        }

        return { success: true };
    } catch (error) {
        console.error('Error creating default departments:', error);
        return { success: false, error };
    }
}

/**
 * Initialize default GST categories (only on fresh database)
 */
async function initializeGstCategories() {
    try {
        console.log('Creating default GST categories...');

        for (const defaultCategory of DEFAULT_GST_CATEGORIES) {
            await prisma.gstCategory.create({
                data: {
                    name: defaultCategory.name,
                    description: defaultCategory.description,
                    isActive: true
                }
            });
            console.log(`✓ Created GST category: ${defaultCategory.name}`);
        }

        return { success: true };
    } catch (error) {
        console.error('Error creating default GST categories:', error);
        return { success: false, error };
    }
}

/**
 * Initialize default vitals settings (only on fresh database)
 */
async function initializeVitalsSettings() {
    try {
        console.log('Creating default vitals settings...');

        for (const vitalSetting of DEFAULT_VITALS_SETTINGS) {
            await prisma.vitalsSettings.create({
                data: vitalSetting
            });
            console.log(`✓ Created vital setting: ${vitalSetting.name}`);
        }

        return { success: true };
    } catch (error) {
        console.error('Error creating default vitals settings:', error);
        return { success: false, error };
    }
}

/**
 * Main initialization function - only runs on fresh database
 */
async function initializeDefaultsOnce() {
    try {
        const isFresh = await isDatabaseFresh();

        if (!isFresh) {
            console.log('📋 Database already initialized - skipping default data creation');
            console.log('   Users can manage roles, departments, and categories through the UI');
            return { success: true, skipped: true };
        }

        console.log('🚀 Fresh database detected - initializing default data...');

        const results = await Promise.allSettled([
            initializeRoles(),
            initializeDepartments(),
            initializeGstCategories(),
            initializeVitalsSettings()
        ]);

        const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
        const failed = results.filter(r => r.status === 'rejected' || !r.value.success).length;

        console.log(`✅ Default data initialization completed!`);
        console.log(`   - Successful: ${successful}`);
        console.log(`   - Failed: ${failed}`);
        console.log('   Users can now manage these items through the UI');

        return { success: true, initialized: true, successful, failed };
    } catch (error) {
        console.error('❌ Error during default initialization:', error);
        return { success: false, error };
    }
}

/**
 * Utility functions for ensuring specific items exist (for backward compatibility)
 * These should only be used when absolutely necessary
 */
async function ensureRoleExists(roleName) {
    try {
        let role = await prisma.rolePermission.findUnique({
            where: { role: roleName }
        });

        if (!role) {
            // Only create if it's a known default role
            const defaultRole = DEFAULT_ROLES.find(r => r.role === roleName);
            if (defaultRole) {
                role = await prisma.rolePermission.create({
                    data: {
                        role: defaultRole.role,
                        permissions: defaultRole.permissions
                    }
                });
                console.log(`⚠️  Created missing default role: ${roleName}`);
            }
        }

        return role;
    } catch (error) {
        console.error(`Error ensuring role exists: ${roleName}`, error);
        throw error;
    }
}

async function ensureDepartmentExists(deptName) {
    try {
        let dept = await prisma.department.findFirst({
            where: { name: deptName }
        });

        if (!dept) {
            // Only create if it's a known default department
            const defaultDept = DEFAULT_DEPARTMENTS.find(d => d.name === deptName);
            if (defaultDept) {
                dept = await prisma.department.create({
                    data: { name: defaultDept.name }
                });
                console.log(`⚠️  Created missing default department: ${deptName}`);
            }
        }

        return dept;
    } catch (error) {
        console.error(`Error ensuring department exists: ${deptName}`, error);
        throw error;
    }
}

async function ensureGstCategoryExists(categoryName) {
    try {
        let category = await prisma.gstCategory.findFirst({
            where: { name: categoryName }
        });

        if (!category) {
            // Only create if it's a known default category
            const defaultCategory = DEFAULT_GST_CATEGORIES.find(c => c.name === categoryName);
            if (defaultCategory) {
                category = await prisma.gstCategory.create({
                    data: {
                        name: defaultCategory.name,
                        description: defaultCategory.description,
                        isActive: true
                    }
                });
                console.log(`⚠️  Created missing default GST category: ${categoryName}`);
            }
        }

        return category;
    } catch (error) {
        console.error(`Error ensuring GST category exists: ${categoryName}`, error);
        throw error;
    }
}

module.exports = {
    initializeDefaultsOnce,
    ensureRoleExists,
    ensureDepartmentExists,
    ensureGstCategoryExists,
    DEFAULT_ROLES,
    DEFAULT_DEPARTMENTS,
    DEFAULT_GST_CATEGORIES,
    DEFAULT_VITALS_SETTINGS
};