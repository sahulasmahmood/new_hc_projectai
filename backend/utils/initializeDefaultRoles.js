const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

// Default roles without permissions - permissions will be assigned manually
const DEFAULT_ROLES = [
  {
    role: 'Doctor',
    permissions: [] // Empty permissions - to be assigned manually
  },
  {
    role: 'Nurse',
    permissions: [] // Empty permissions - to be assigned manually
  }
];

/**
 * Initialize default roles in the database
 * This function is idempotent - it won't create duplicates
 */
async function initializeDefaultRoles() {
  try {
    console.log('Initializing default roles...');
    
    for (const defaultRole of DEFAULT_ROLES) {
      // Check if role already exists
      const existingRole = await prisma.rolePermission.findUnique({
        where: { role: defaultRole.role }
      });
      
      if (!existingRole) {
        // Create the role
        await prisma.rolePermission.create({
          data: {
            role: defaultRole.role,
            permissions: defaultRole.permissions
          }
        });
        console.log(`✓ Created role: ${defaultRole.role}`);
      } else {
        console.log(`- Role already exists: ${defaultRole.role}`);
      }
    }
    
    console.log('Default roles initialization completed!');
    return { success: true };
  } catch (error) {
    console.error('Error initializing default roles:', error);
    return { success: false, error };
  }
}

/**
 * Get or create a role by name
 * Useful for ensuring a role exists before assigning it to staff
 */
async function ensureRoleExists(roleName) {
  try {
    let role = await prisma.rolePermission.findUnique({
      where: { role: roleName }
    });
    
    if (!role) {
      // Find matching default role
      const defaultRole = DEFAULT_ROLES.find(r => r.role === roleName);
      
      if (defaultRole) {
        // Create from default
        role = await prisma.rolePermission.create({
          data: {
            role: defaultRole.role,
            permissions: defaultRole.permissions
          }
        });
        console.log(`Created missing role: ${roleName}`);
      } else {
        // Create with empty permissions
        role = await prisma.rolePermission.create({
          data: {
            role: roleName,
            permissions: []
          }
        });
        console.log(`Created custom role: ${roleName}`);
      }
    }
    
    return role;
  } catch (error) {
    console.error(`Error ensuring role exists: ${roleName}`, error);
    throw error;
  }
}

module.exports = {
  initializeDefaultRoles,
  ensureRoleExists,
  DEFAULT_ROLES
};
