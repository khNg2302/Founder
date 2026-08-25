import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as argon2 from 'argon2';

import { AccountService } from '../account/account.service';
import { UserService } from '../user/user.service';
import { RegisterDto } from './dto/register.dto';
import { PrismaService } from 'prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    private readonly accountService: AccountService,
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

    return {
      userId: account.userId,
      accountId: account.id,
    };
  }
}
