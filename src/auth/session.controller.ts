import {
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from './guards/jwt-auth.guard';
import {
  AuthenticatedUser,
  CurrentUser,
} from './decorators/current-user.decorator';
import { RefreshTokenService } from './refresh-token.service';

@Controller('sessions')
export class SessionController {
  constructor(private readonly refreshTokenService: RefreshTokenService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getSessions(@CurrentUser() user: AuthenticatedUser) {
    return this.refreshTokenService.findActiveByAccountId(user.accountId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async revokeSession(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') sessionId: string,
  ) {
    const revoked = await this.refreshTokenService.revokeByIdForAccount(
      sessionId,
      user.accountId,
    );

    if (!revoked) {
      throw new NotFoundException('Session not found');
    }

    return {
      message: 'Session revoked successfully',
    };
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  async revokeAllSessions(@CurrentUser() user: AuthenticatedUser) {
    await this.refreshTokenService.revokeAllByAccountId(user.accountId);

    return {
      message: 'All sessions revoked successfully',
    };
  }
}
