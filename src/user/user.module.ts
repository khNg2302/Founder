import { Module } from '@nestjs/common';

import { AuthorizationModule } from '../authorization/authorization.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { AccountModule } from 'src/account/account.module';
import { RoleModule } from 'src/role/role.module';
import { CategoryModule } from 'src/category/category.module';
import { MatchingModule } from 'src/matching/matching.module';

@Module({
  imports: [
    AuthorizationModule,
    AccountModule,
    RoleModule,
    CategoryModule,
    MatchingModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
