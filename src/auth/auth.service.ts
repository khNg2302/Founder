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
import { GoogleAccount } from './types/google-account.type';

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

  async loginWithGoogle(googleAccount: GoogleAccount) {
    if (!googleAccount.emailVerified) {
      throw new UnauthorizedException('Google email is not verified');
    }

    const existingAccount = await this.accountService.findByProviderAccountId(
      'GOOGLE',
      googleAccount.providerAccountId,
    );

    if (existingAccount) {
      return this.issueTokens(existingAccount);
    }

    const existingEmailAccount = await this.accountService.findByEmail(
      googleAccount.email,
    );

    if (existingEmailAccount) {
      if (existingEmailAccount.provider !== 'LOCAL') {
        throw new ConflictException(
          'Email is already associated with another provider',
        );
      }

      const account = await this.accountService.createGoogle({
        userId: existingEmailAccount.userId,
        providerAccountId: googleAccount.providerAccountId,
        email: googleAccount.email,
      });

      return this.issueTokens(account);
    }

    const account = await this.prisma.$transaction(async (tx) => {
      const user = await this.userService.create(
        {
          name: googleAccount.name,
        },
        tx,
      );

      return this.accountService.createGoogle(
        {
          userId: user.id,
          providerAccountId: googleAccount.providerAccountId,
          email: googleAccount.email,
        },
        tx,
      );
    });

    return this.issueTokens(account);
  }
}
