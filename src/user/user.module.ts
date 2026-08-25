import { Module } from '@nestjs/common';

import { PrismaService } from 'prisma/prisma.service';
import { AccountModule } from '../account/account.module';
import { RefreshTokenService } from '../auth/refresh-token.service';

import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [AccountModule],
  controllers: [UserController],
  providers: [UserService, PrismaService, RefreshTokenService],
  exports: [UserService],
})
export class UserModule {}
