import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Patch,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../auth/decorators/current-user.decorator';

import { AccountService } from './account.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ChangeEmailDto } from './dto/change-email.dto';

@Controller('accounts')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: AuthenticatedUser) {
    const account = await this.accountService.findByIdForUser(
      user.accountId,
      user.userId,
    );

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    return account;
  }

  @Patch('me/password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.accountService.changePassword(
      user.accountId,
      user.userId,
      dto.currentPassword,
      dto.newPassword,
    );

    return {
      message: 'Password changed successfully',
    };
  }

  @Patch('me/email')
  @UseGuards(JwtAuthGuard)
  async changeEmail(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangeEmailDto,
  ) {
    return this.accountService.changeEmail(
      user.accountId,
      user.userId,
      dto.newEmail,
      dto.currentPassword,
    );
  }
}
