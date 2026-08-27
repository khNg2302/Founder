import { Module } from '@nestjs/common';

import { AuthorizationModule } from 'src/authorization/authorization.module';
import { UserModule } from 'src/user/user.module';
import { AccountModule } from 'src/account/account.module';
import { RoleModule } from 'src/role/role.module';

import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { RefreshTokenModule } from 'src/auth/refresh-token.module';

@Module({
  imports: [
    AuthorizationModule,
    UserModule,
    AccountModule,
    RoleModule,
    RefreshTokenModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
