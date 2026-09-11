import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CurrentAccessToken } from 'src/auth/decorators/current-access-token.decorator';

import { CreateParticipationDto } from './dto/create-participation.dto';
import { ParticipationService } from './participation.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import {
  AuthenticatedUser,
  CurrentUser,
} from 'src/auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller()
export class ParticipationController {
  constructor(private readonly participationService: ParticipationService) {}

  @Post('projects/:projectId/participations')
  @HttpCode(HttpStatus.CREATED)
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateParticipationDto,
    @CurrentAccessToken() accessToken: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.participationService.create(
      projectId,
      dto,
      user.userId,
      accessToken,
    );
  }

  @Get('participations/me')
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.participationService.findMyParticipations(user.userId);
  }

  @Get('participations/:id')
  findById(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.participationService.findById(id, user.userId);
  }

  @Get('projects/:projectId/participations')
  findProjectParticipations(
    @Param('projectId') projectId: string,
    @CurrentAccessToken() accessToken: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.participationService.findProjectParticipations(
      projectId,
      user.userId,
      accessToken,
    );
  }

  @Patch('participations/:id/cancel')
  cancel(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.participationService.cancel(id, user.userId);
  }

  @Patch('participations/:id/approve')
  approve(
    @Param('id') id: string,
    @CurrentAccessToken() accessToken: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.participationService.approve(id, user.userId, accessToken);
  }

  @Patch('participations/:id/reject')
  reject(
    @Param('id') id: string,
    @CurrentAccessToken() accessToken: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.participationService.reject(id, user.userId, accessToken);
  }

  @Patch('participations/:id/leave')
  leave(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.participationService.leave(id, user.userId);
  }

  @Patch('participations/:id/remove')
  remove(
    @Param('id') id: string,
    @CurrentAccessToken() accessToken: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.participationService.remove(id, user.userId, accessToken);
  }
}
