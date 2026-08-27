import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as argon2 from 'argon2';

import { PrismaService } from 'prisma/prisma.service';
import { AccountService } from '../account/account.service';
import { UserService } from '../user/user.service';
import { RegisterDto } from './dto/register.dto';
import { TokenService } from './token.service';
import { RefreshTokenService } from '../common/security/token/refresh-token.service';

import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { OAuthAccount } from './types/oauth-account.type';
import { Prisma } from 'generated/prisma/client';
import { ReactivationTokenService } from './reactivation-token.service';
import { RoleService } from 'src/role/role.service';
import { CreateUserByAdminDto } from 'src/user/dto/create-user-by-admin.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    private readonly accountService: AccountService,
    private readonly tokenService: TokenService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly reactivationTokenService: ReactivationTokenService,
    private readonly roleService: RoleService,
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

      await this.roleService.assignDefaultUserRole(user.id, tx);

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

  async issueTokens(account: { userId: string; id: string }) {
    const refreshToken = await this.refreshTokenService.create(
      account.userId,
      account.id,
    );

    const payload = {
      sub: account.userId,
      accountId: account.id,
      sessionId: refreshToken.refreshTokenId,
    };

    const accessToken = await this.tokenService.createAccessToken(payload);

    return {
      accessToken,
      refreshToken: refreshToken.token,
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
      sessionId: storedToken.id,
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

  async logout(sessionId: string) {
    await this.refreshTokenService.revoke(sessionId);

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
      // Có Account cùng provider nhưng providerAccountId khác
      // → email đã tồn tại trên cùng provider
      const sameProvider = existingAccounts.find(
        (account) => account.provider === oauthAccount.provider,
      );

      if (sameProvider) {
        throw new ConflictException(
          'Email is already associated with this provider',
        );
      }

      // Tất cả Account cùng email phải thuộc cùng một User
      const userIds = new Set(
        existingAccounts.map((account) => account.userId),
      );

      if (userIds.size > 1) {
        throw new ConflictException('Email is associated with multiple users');
      }

      // Email đã thuộc User này
      const userId = existingAccounts[0].userId;

      try {
        const account = await this.accountService.createOAuth({
          userId,
          provider: oauthAccount.provider,
          providerAccountId: oauthAccount.providerAccountId,
          email: oauthAccount.email,
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

    // 3. Email hoàn toàn mới
    try {
      const account = await this.prisma.$transaction(async (tx) => {
        const user = await this.userService.create(
          {
            name: oauthAccount.name,
          },
          tx,
        );

        await this.roleService.assignDefaultUserRole(user.id, tx);

        return this.accountService.createOAuth(
          {
            userId: user.id,
            provider: oauthAccount.provider,
            providerAccountId: oauthAccount.providerAccountId,
            email: oauthAccount.email,
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

  async deleteAccount(userId: string) {
    return this.prisma.$transaction(async (tx) => {
      await this.accountService.disableAllByUserId(userId, tx);

      await this.refreshTokenService.revokeAllByUserId(userId, tx);

      await this.userService.markPendingDeletion(userId, tx);

      return this.reactivationTokenService.create(userId, tx);
    });
  }

  async reactivateAccount(token: string) {
    return this.prisma.$transaction(async (tx) => {
      const reactivationToken = await this.reactivationTokenService.findValid(
        token,
        tx,
      );

      if (!reactivationToken) {
        throw new UnauthorizedException(
          'Invalid or expired reactivation token',
        );
      }

      const user = await this.userService.findById(
        reactivationToken.userId,
        tx,
      );

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.status !== 'PENDING_DELETION') {
        throw new ConflictException('Account is not pending deletion');
      }

      if (!user.deletionRequestedAt) {
        throw new ConflictException('Deletion request date is missing');
      }

      const deadline = new Date(user.deletionRequestedAt);

      deadline.setDate(deadline.getDate() + 30);

      if (new Date() >= deadline) {
        throw new ConflictException('Account deletion period has expired');
      }

      await this.accountService.enableAllByUserId(user.id, tx);

      await this.userService.reactivate(user.id, tx);

      await this.reactivationTokenService.markUsed(reactivationToken.id, tx);

      return {
        message: 'Account reactivated successfully',
      };
    });
  }

  async createUserByAdmin(dto: CreateUserByAdminDto) {
    const existingAccount = await this.accountService.findLocalByEmail(
      dto.email,
    );

    if (existingAccount) {
      throw new ConflictException('Email already exists');
    }

    const role = await this.roleService.findByName(dto.role);

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const passwordHash = await argon2.hash(dto.password);

    return this.prisma.$transaction(async (tx) => {
      const user = await this.userService.create(
        {
          name: dto.name,
        },
        tx,
      );

      await this.userService.assignRole(user.id, role.id, tx);

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
}
