import { Module } from '@nestjs/common';
import { AccountService } from './account.service';
import { AccountController } from './account.controller';
import { RefreshTokenService } from 'src/auth/refresh-token.service';

@Module({
  controllers: [AccountController],
  providers: [AccountService, RefreshTokenService],
  exports: [AccountService],
})
export class AccountModule {}
