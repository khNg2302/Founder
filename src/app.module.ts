import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from 'prisma/prisma.module';
import { AccountModule } from './account/account.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AccountModule,
    UserModule,
    AuthModule,
    AdminModule,
  ],
})
export class AppModule {}
