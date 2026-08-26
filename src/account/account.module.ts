import { Module } from '@nestjs/common';
import { AccountService } from './account.service';
import { AccountController } from './account.controller';
import { RefreshTokenService } from 'src/auth/refresh-token.service';
import { TokenModule } from 'src/common/security/token/token.module';

@Module({
  imports: [TokenModule],
  controllers: [AccountController],
  providers: [AccountService, RefreshTokenService],
  exports: [AccountService],
})
export class AccountModule {}
