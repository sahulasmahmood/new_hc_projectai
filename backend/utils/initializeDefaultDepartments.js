const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

// Default departments
const DEFAULT_DEPARTMENTS = [
  { name: 'General' },
  { name: 'Nursing' },
  { name: 'Administration' },
  { name: 'Support Staff' },
  { name: 'Other' }
];

/**
 * Initialize default departments in the database
 * This function is idempotent - it won't create duplicates
 */
async function initializeDefaultDepartments() {
  try {
    console.log('Initializing default departments...');
    
    for (const defaultDept of DEFAULT_DEPARTMENTS) {
      // Check if department already exists
      const existingDept = await prisma.department.findFirst({
        where: { name: defaultDept.name }
      });
      
      if (!existingDept) {
        // Create the department
        await prisma.department.create({
          data: { name: defaultDept.name }
        });
        console.log(`✓ Created department: ${defaultDept.name}`);
      } else {
        console.log(`- Department already exists: ${defaultDept.name}`);
      }
    }
    
    console.log('Default departments initialization completed!');
    return { success: true };
  } catch (error) {
    console.error('Error initializing default departments:', error);
    return { success: false, error };
  }
}

module.exports = {
  initializeDefaultDepartments,
  DEFAULT_DEPARTMENTS
};
