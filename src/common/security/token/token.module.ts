import { Module } from '@nestjs/common';
import { OpaqueTokenService } from './opaque-token.service';

@Module({
  providers: [OpaqueTokenService],
  exports: [OpaqueTokenService],
})
export class TokenModule {}
