import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from 'generated/prisma/client';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

const roles = [
  {
    name: 'ADMIN',
    description: 'Administrator with full system access',
  },
  {
    name: 'USER',
    description: 'Standard user',
  },
];

const permissions = [
  {
    name: 'user:read',
    description: 'View users',
  },
  {
    name: 'user:create',
    description: 'Create users',
  },
  {
    name: 'user:update',
    description: 'Update users',
  },
  {
    name: 'user:delete',
    description: 'Delete users',
  },
  {
    name: 'profile:read',
    description: 'View own profile',
  },
  {
    name: 'profile:update',
    description: 'Update own profile',
  },
];

const rolePermissions = {
  ADMIN: [
    'user:read',
    'user:create',
    'user:update',
    'user:delete',
    'profile:read',
    'profile:update',
  ],

  USER: ['profile:read', 'profile:update'],
};

async function main() {
  console.log('Seeding roles...');

  for (const role of roles) {
    await prisma.role.upsert({
      where: {
        name: role.name,
      },
      update: {
        description: role.description,
      },
      create: role,
    });
  }

  console.log('Seeding permissions...');

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: {
        name: permission.name,
      },
      update: {
        description: permission.description,
      },
      create: permission,
    });
  }

  console.log('Seeding role permissions...');

  for (const [roleName, permissionNames] of Object.entries(rolePermissions)) {
    const role = await prisma.role.findUnique({
      where: {
        name: roleName,
      },
    });

    if (!role) {
      throw new Error(`Role ${roleName} not found`);
    }

    for (const permissionName of permissionNames) {
      const permission = await prisma.permission.findUnique({
        where: {
          name: permissionName,
        },
      });

      if (!permission) {
        throw new Error(`Permission ${permissionName} not found`);
      }

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id,
        },
      });
    }
  }

  console.log('Seed completed successfully.');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
