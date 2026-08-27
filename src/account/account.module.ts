import { Module } from '@nestjs/common';
import { AccountService } from './account.service';
import { AccountController } from './account.controller';
import { TokenModule } from 'src/common/security/token/token.module';
import { RefreshTokenModule } from 'src/common/security/token/refresh-token.module';

@Module({
  imports: [TokenModule, RefreshTokenModule],
  controllers: [AccountController],
  providers: [AccountService],
  exports: [AccountService],
})
export class AccountModule {}
