import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as argon2 from 'argon2';

import { PrismaService } from 'prisma/prisma.service';
import { AccountService } from '../account/account.service';
import { UserService } from '../user/user.service';
import { RegisterDto } from './dto/register.dto';
import { TokenService } from './token.service';
import { RefreshTokenService } from './refresh-token.service';

import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';
import { OAuthAccount } from './types/oauth-account.type';
import { Prisma } from 'generated/prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    private readonly accountService: AccountService,
    private readonly tokenService: TokenService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  async register(dto: RegisterDto) {
    const existingAccount = await this.accountService.findLocalByEmail(
      dto.email,
    );

    if (existingAccount) {
      throw new ConflictException('Email already exists');
    }

    const passwordHash = await argon2.hash(dto.password);

    return this.prisma.$transaction(async (tx) => {
      const user = await this.userService.create(
        {
          name: dto.name,
        },
        tx,
      );

      const account = await this.accountService.createLocal(
        {
          userId: user.id,
          email: dto.email,
          passwordHash,
        },
        tx,
      );

      return {
        userId: user.id,
        accountId: account.id,
      };
    });
  }

  private async issueTokens(account: { id: string; userId: string }) {
    const accessToken = await this.tokenService.createAccessToken({
      sub: account.userId,
      accountId: account.id,
    });

    const refreshToken = await this.refreshTokenService.create(
      account.userId,
      account.id,
    );

    return {
      accessToken,
      refreshToken: refreshToken.token,
      refreshTokenId: refreshToken.refreshTokenId,
      expiresAt: refreshToken.expiresAt,
    };
  }

  async login(dto: LoginDto) {
    const account = await this.accountService.findLocalByEmail(dto.email);

    if (!account || !account.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (account.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is disabled');
    }

    const passwordValid = await argon2.verify(
      account.passwordHash,
      dto.password,
    );

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { accessToken, refreshToken } = await this.issueTokens(account);

    return {
      accessToken,
      refreshToken,
    };
  }

  async refresh(dto: RefreshTokenDto) {
    const storedToken = await this.refreshTokenService.findValid(
      dto.refreshToken,
    );

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.refreshTokenService.revoke(storedToken.id);

    const accessToken = await this.tokenService.createAccessToken({
      sub: storedToken.userId,
      accountId: storedToken.accountId,
    });

    const refreshToken = await this.refreshTokenService.create(
      storedToken.userId,
      storedToken.accountId,
    );

    return {
      accessToken,
      refreshToken: refreshToken.token,
    };
  }

  async logout(dto: LogoutDto) {
    await this.refreshTokenService.revokeByToken(dto.refreshToken);

    return {
      message: 'Logged out successfully',
    };
  }

  async loginWithOAuth(oauthAccount: OAuthAccount) {
    if (!oauthAccount.emailVerified) {
      throw new UnauthorizedException(
        `${oauthAccount.provider} email is not verified`,
      );
    }

    // 1. Tìm đúng OAuth Account
    const existingAccount = await this.accountService.findByProviderAccountId(
      oauthAccount.provider,
      oauthAccount.providerAccountId,
    );

    if (existingAccount) {
      return this.issueTokens(existingAccount);
    }

    // 2. Tìm tất cả Account có cùng email
    const existingAccounts = await this.accountService.findAllByEmail(
      oauthAccount.email,
    );

    if (existingAccounts.length > 0) {
      const sameProvider = existingAccounts.find(
        (account) => account.provider === oauthAccount.provider,
      );

      if (sameProvider) {
        return this.issueTokens(sameProvider);
      }

      const localAccount = existingAccounts.find(
        (account) => account.provider === 'LOCAL',
      );

      if (localAccount) {
        try {
          const account = await this.accountService.createOAuth({
            userId: localAccount.userId,
            provider: oauthAccount.provider,
            providerAccountId: oauthAccount.providerAccountId,
            email: oauthAccount.email.toLowerCase(),
          });

          return this.issueTokens(account);
        } catch (error) {
          return this.handleOAuthConflict(
            error,
            oauthAccount.provider,
            oauthAccount.providerAccountId,
          );
        }
      }

      // Email đã thuộc OAuth provider khác
      throw new ConflictException(
        'Email is already associated with another provider',
      );
    }

    // 3. Email hoàn toàn mới
    try {
      const account = await this.prisma.$transaction(async (tx) => {
        const user = await this.userService.create(
          {
            name: oauthAccount.name,
          },
          tx,
        );

        return this.accountService.createOAuth(
          {
            userId: user.id,
            provider: oauthAccount.provider,
            providerAccountId: oauthAccount.providerAccountId,
            email: oauthAccount.email.toLowerCase(),
          },
          tx,
        );
      });

      return this.issueTokens(account);
    } catch (error) {
      return this.handleOAuthConflict(
        error,
        oauthAccount.provider,
        oauthAccount.providerAccountId,
      );
    }
  }

  private async handleOAuthConflict(
    error: unknown,
    provider: OAuthAccount['provider'],
    providerAccountId: string,
  ) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      const existingAccount = await this.accountService.findByProviderAccountId(
        provider,
        providerAccountId,
      );

      if (existingAccount) {
        return this.issueTokens(existingAccount);
      }
    }

    throw error;
  }
}
