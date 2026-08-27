import { Module } from '@nestjs/common';

import { AuthorizationModule } from '../authorization/authorization.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [AuthorizationModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
