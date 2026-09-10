import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
}
