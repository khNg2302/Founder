import { Module } from '@nestjs/common';

import { ProjectClient } from 'src/project/project.client';

import { ParticipationController } from './participation.controller';
import { ParticipationService } from './participation.service';

@Module({
  controllers: [ParticipationController],
  providers: [ParticipationService, ProjectClient],
})
export class ParticipationModule {}
