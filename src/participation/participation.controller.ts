import {
  Body,
  Controller,
  Delete,
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
import { CreateParticipationContributionDto } from './dto/create-participation-contribution.dto';
import { CreateCommunityFeedbackDto } from './dto/create-community-feedback.dto';
import { UpdateCommunityFeedbackDto } from './dto/update-community-feedback.dto';

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

  @Post('participations/:participationId/contributions')
  @HttpCode(HttpStatus.CREATED)
  addContribution(
    @Param('participationId') participationId: string,
    @Body() dto: CreateParticipationContributionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.participationService.addContribution(
      participationId,
      dto,
      user.userId,
    );
  }

  @Get('participations/:participationId/contributions')
  findContributions(
    @Param('participationId') participationId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.participationService.findContributions(
      participationId,
      user.userId,
    );
  }

  @Delete('participations/:participationId/contributions/:userContributionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeContribution(
    @Param('participationId') participationId: string,
    @Param('userContributionId') userContributionId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.participationService.removeContribution(
      participationId,
      userContributionId,
      user.userId,
    );
  }

  @Post('participations/:participationId/feedbacks')
  @HttpCode(HttpStatus.CREATED)
  createFeedback(
    @Param('participationId') participationId: string,
    @Body() dto: CreateCommunityFeedbackDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.participationService.createFeedback(
      participationId,
      dto,
      user.userId,
    );
  }

  @Get('participations/:participationId/feedbacks')
  findFeedbacks(
    @Param('participationId') participationId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.participationService.findFeedbacks(
      participationId,
      user.userId,
    );
  }

  @Patch('participations/:participationId/feedbacks/:feedbackId')
  updateFeedback(
    @Param('participationId') participationId: string,
    @Param('feedbackId') feedbackId: string,
    @Body() dto: UpdateCommunityFeedbackDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.participationService.updateFeedback(
      participationId,
      feedbackId,
      dto,
      user.userId,
    );
  }

  @Delete('participations/:participationId/feedbacks/:feedbackId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteFeedback(
    @Param('participationId') participationId: string,
    @Param('feedbackId') feedbackId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.participationService.deleteFeedback(
      participationId,
      feedbackId,
      user.userId,
    );
  }
}
