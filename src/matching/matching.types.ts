export interface MatchedProjectResponse {
  projectId: string;
  name: string;
  description?: string | null;
  scope: string;
  stage: string;
  activityStatus: string;
  createdAt: string;
  investmentGoal?: string | null;
  owner: {
    id: string;
    name?: string | null;
  };
  matchLevel: string;
  score: number;
}
