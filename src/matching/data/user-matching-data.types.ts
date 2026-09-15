export interface UserMatchingContribution {
  id: string;
  contributionId: string;
  name: string;
}

export interface UserMatchingExperience {
  contributionId: string;
  durationValue: number | null;
  durationUnit: 'MONTH' | 'YEAR' | null;
}

export interface UserMatchingData {
  userId: string;
  categoryIds: string[];
  audienceTypeIds: string[];
  contributions: UserMatchingContribution[];
  experiences: UserMatchingExperience[];
}
