import { Module } from '@nestjs/common';

import { RefreshTokenService } from './refresh-token.service';
import { TokenModule } from 'src/common/security/token/token.module';

@Module({
  imports: [TokenModule],
  providers: [RefreshTokenService],
  exports: [RefreshTokenService],
})
export class RefreshTokenModule {}
