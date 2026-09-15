import { MatchingEngine } from './matching.engine';

describe('MatchingEngine', () => {
  let engine: MatchingEngine;

  const categoryMatcher = {
    match: jest.fn(),
  };

  const audienceMatcher = {
    match: jest.fn(),
  };

  const requirementMatcher = {
    match: jest.fn(),
  };

  const user = {
    userId: 'user-1',
    categoryIds: ['cat-1'],
    audienceTypeIds: ['aud-1'],
    contributions: [],
    experiences: [],
  };

  const project = {
    projectId: 'project-1',
    categoryIds: ['cat-1'],
    audienceTypeIds: ['aud-1'],
    humanRequirements: [],
  };

  const catalog = [];

  beforeEach(() => {
    jest.clearAllMocks();

    engine = new MatchingEngine(
      categoryMatcher as any,
      audienceMatcher as any,
      requirementMatcher as any,
    );
  });

  it('should be defined', () => {
    expect(engine).toBeDefined();
  });

  it('should calculate weighted score from all components', () => {
    categoryMatcher.match.mockReturnValue({
      score: 80,
      matchedCount: 4,
      totalCount: 5,
    });

    audienceMatcher.match.mockReturnValue({
      score: 60,
      matchedCount: 3,
      totalCount: 5,
    });

    requirementMatcher.match.mockReturnValue({
      requirementId: 'req-1',
      score: 90,
      matchedCount: 9,
      evaluableCount: 10,
      criteria: [],
    });

    const result = engine.match(user, project, catalog);

    expect(result.score).toBeCloseTo(83);

    expect(result.matchLevel).toBe('STRONG');

    expect(result.categoryScore).toBe(80);
    expect(result.audienceScore).toBe(60);
    expect(result.requirementScore).toBe(90);
  });

  it('should ignore N/A components when calculating weighted score', () => {
    categoryMatcher.match.mockReturnValue({
      score: 80,
      matchedCount: 4,
      totalCount: 5,
    });

    audienceMatcher.match.mockReturnValue({
      score: null,
      matchedCount: 0,
      totalCount: 0,
    });

    requirementMatcher.match.mockReturnValue({
      requirementId: 'req-1',
      score: 90,
      matchedCount: 9,
      evaluableCount: 10,
      criteria: [],
    });

    const result = engine.match(user, project, catalog);

    const expectedScore = (80 * 25 + 90 * 60) / (25 + 60);

    expect(result.score).toBeCloseTo(expectedScore);
  });

  it('should use only available requirement when other components are N/A', () => {
    categoryMatcher.match.mockReturnValue({
      score: null,
      matchedCount: 0,
      totalCount: 0,
    });

    audienceMatcher.match.mockReturnValue({
      score: null,
      matchedCount: 0,
      totalCount: 0,
    });

    requirementMatcher.match.mockReturnValue({
      requirementId: 'req-1',
      score: 80,
      matchedCount: 8,
      evaluableCount: 10,
      criteria: [],
    });

    const result = engine.match(user, project, catalog);

    expect(result.score).toBe(80);
    expect(result.matchLevel).toBe('STRONG');
  });

  it('should return null when every component is N/A', () => {
    categoryMatcher.match.mockReturnValue({
      score: null,
      matchedCount: 0,
      totalCount: 0,
    });

    audienceMatcher.match.mockReturnValue({
      score: null,
      matchedCount: 0,
      totalCount: 0,
    });

    requirementMatcher.match.mockReturnValue(null);

    const result = engine.match(user, project, catalog);

    expect(result.score).toBeNull();
    expect(result.matchLevel).toBeNull();
  });

  it('should classify EXCELLENT from 90', () => {
    categoryMatcher.match.mockReturnValue({
      score: 90,
    });

    audienceMatcher.match.mockReturnValue({
      score: null,
    });

    requirementMatcher.match.mockReturnValue(null);

    const result = engine.match(user, project, catalog);

    expect(result.score).toBe(90);
    expect(result.matchLevel).toBe('EXCELLENT');
  });

  it('should classify STRONG from 75', () => {
    categoryMatcher.match.mockReturnValue({
      score: 75,
    });

    audienceMatcher.match.mockReturnValue({
      score: null,
    });

    requirementMatcher.match.mockReturnValue(null);

    const result = engine.match(user, project, catalog);

    expect(result.matchLevel).toBe('STRONG');
  });

  it('should classify GOOD from 60', () => {
    categoryMatcher.match.mockReturnValue({
      score: 60,
    });

    audienceMatcher.match.mockReturnValue({
      score: null,
    });

    requirementMatcher.match.mockReturnValue(null);

    const result = engine.match(user, project, catalog);

    expect(result.matchLevel).toBe('GOOD');
  });

  it('should classify MODERATE from 40', () => {
    categoryMatcher.match.mockReturnValue({
      score: 40,
    });

    audienceMatcher.match.mockReturnValue({
      score: null,
    });

    requirementMatcher.match.mockReturnValue(null);

    const result = engine.match(user, project, catalog);

    expect(result.matchLevel).toBe('MODERATE');
  });

  it('should classify LOW below 40', () => {
    categoryMatcher.match.mockReturnValue({
      score: 39.99,
    });

    audienceMatcher.match.mockReturnValue({
      score: null,
    });

    requirementMatcher.match.mockReturnValue(null);

    const result = engine.match(user, project, catalog);

    expect(result.matchLevel).toBe('LOW');
  });
});
