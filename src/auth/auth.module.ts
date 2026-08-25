import { Module } from '@nestjs/common';
import { AccountModule } from '../account/account.module';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [UserModule, AccountModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
