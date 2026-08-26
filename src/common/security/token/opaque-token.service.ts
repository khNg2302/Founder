import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';

@Injectable()
export class OpaqueTokenService {
  generateSecret(): string {
    return randomBytes(64).toString('hex');
  }

  async hash(secret: string): Promise<string> {
    return argon2.hash(secret);
  }

  async verify(hash: string, secret: string): Promise<boolean> {
    return argon2.verify(hash, secret);
  }

  parse(token: string): {
    tokenId: string;
    secret: string;
  } | null {
    const [tokenId, secret] = token.split('.');

    if (!tokenId || !secret) {
      return null;
    }

    return {
      tokenId,
      secret,
    };
  }

  build(tokenId: string, secret: string): string {
    return `${tokenId}.${secret}`;
  }
}
