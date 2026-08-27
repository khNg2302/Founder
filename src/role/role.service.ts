import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from 'prisma/prisma.service';
import { PrismaTransaction } from 'prisma/prisma.types';

@Injectable()
export class RoleService {
  constructor(private readonly prisma: PrismaService) {}

  async assignDefaultUserRole(
    userId: string,
    tx: PrismaTransaction = this.prisma,
  ) {
    const role = await tx.role.findUnique({
      where: {
        name: 'USER',
      },
    });

    if (!role) {
      throw new NotFoundException('Default USER role not found');
    }

    return tx.userRole.create({
      data: {
        userId,
        roleId: role.id,
      },
    });
  }

  async findByName(name: string, tx: PrismaTransaction = this.prisma) {
    return tx.role.findUnique({
      where: {
        name,
      },
    });
  }
}
