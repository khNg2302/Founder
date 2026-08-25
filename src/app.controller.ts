import { Controller, Get } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getDatabaseStatus() {
    const result = await this.prisma.$queryRaw<{ now: Date }[]>`SELECT NOW()`;

    return {
      database: 'connected',
      time: result[0].now,
    };
  }
}
