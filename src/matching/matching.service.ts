import { Injectable } from '@nestjs/common';

import { ProjectClient } from '../project/project.client';

import { ContributionCatalogService } from './data/contribution-catalog.service';

import { UserMatchingDataService } from './data/user-matching-data.service';

import { MatchingEngine } from './engine/matching.engine';

import { MatchedProjectResponse } from './matching.types';
import { NotificationService } from 'src/notification/notification.service';

@Injectable()
export class MatchingService {
  constructor(
    private readonly userMatchingDataService: UserMatchingDataService,
    private readonly contributionCatalogService: ContributionCatalogService,
    private readonly projectClient: ProjectClient,
    private readonly matchingEngine: MatchingEngine,
    private readonly notificationService: NotificationService,
  ) {}

  async getMatchedProjects(
    userId: string,
    accessToken: string,
  ): Promise<MatchedProjectResponse[]> {
    const [userMatchingData, contributionCatalog, projects] = await Promise.all(
      [
        this.userMatchingDataService.getByUserId(userId),
        this.contributionCatalogService.getAll(),
        this.projectClient.findAll(accessToken),
      ],
    );

    const candidateProjects = projects.filter(
      (project) => project.owner.id !== userId,
    );

    if (candidateProjects.length === 0) {
      return [];
    }

    const projectIds = candidateProjects.map((project) => project.id);

    const matchingData = await this.projectClient.getMatchingData(
      projectIds,
      accessToken,
    );

    const matchingDataMap = new Map(
      matchingData.map((item) => [item.id, item]),
    );

    const results: MatchedProjectResponse[] = [];

    for (const project of candidateProjects) {
      const data = matchingDataMap.get(project.id);

      if (!data) {
        continue;
      }

      const result = this.matchingEngine.match(
        userMatchingData,
        {
          projectId: project.id,
          categoryIds: data.categories.map((category) => category.id),
          audienceTypeIds: data.audiences.map((audience) => audience.id),
          humanRequirements: data.humanRequirements,
        },
        contributionCatalog,
      );

      if (result.score === null || result.matchLevel === null) {
        continue;
      }

      try {
        await this.notificationService.createProjectMatch({
          userId,
          projectId: project.id,
          projectName: project.name,
          matchLevel: result.matchLevel,
        });
      } catch (error) {
        console.error(
          `Failed to create project match notification for project '${project.id}'`,
          error,
        );
      }

      results.push({
        projectId: project.id,
        name: project.name,
        description: project.description,
        scope: project.scope,
        stage: project.stage,
        activityStatus: project.activityStatus,
        createdAt: project.createdAt,
        investmentGoal: project.investmentGoal,
        owner: project.owner,
        matchLevel: result.matchLevel,
        score: result.score,
      });
    }

    return results.sort((a, b) => b.score - a.score);
  }
}
