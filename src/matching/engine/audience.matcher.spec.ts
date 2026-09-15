import { AudienceMatcher } from './audience.matcher';

describe('AudienceMatcher', () => {
  let matcher: AudienceMatcher;

  beforeEach(() => {
    matcher = new AudienceMatcher();
  });

  it('should be defined', () => {
    expect(matcher).toBeDefined();
  });

  it('should return 100 when all project audiences match', () => {
    const result = matcher.match(
      ['audience-1', 'audience-2', 'audience-3'],
      ['audience-1', 'audience-2'],
    );

    expect(result).toEqual({
      score: 100,
      matchedCount: 2,
      totalCount: 2,
    });
  });

  it('should calculate partial match correctly', () => {
    const result = matcher.match(
      ['audience-1', 'audience-2'],
      ['audience-1', 'audience-3'],
    );

    expect(result).toEqual({
      score: 50,
      matchedCount: 1,
      totalCount: 2,
    });
  });

  it('should return 0 when no audience matches', () => {
    const result = matcher.match(
      ['audience-1', 'audience-2'],
      ['audience-3', 'audience-4'],
    );

    expect(result).toEqual({
      score: 0,
      matchedCount: 0,
      totalCount: 2,
    });
  });

  it('should return null score when project has no audiences', () => {
    const result = matcher.match(['audience-1', 'audience-2'], []);

    expect(result).toEqual({
      score: null,
      matchedCount: 0,
      totalCount: 0,
    });
  });

  it('should ignore duplicate project audiences', () => {
    const result = matcher.match(
      ['audience-1'],
      ['audience-1', 'audience-1', 'audience-2'],
    );

    expect(result).toEqual({
      score: 50,
      matchedCount: 1,
      totalCount: 2,
    });
  });

  it('should not depend on the number of user audiences', () => {
    const result = matcher.match(
      ['audience-1', 'audience-2', 'audience-3', 'audience-4'],
      ['audience-1', 'audience-2'],
    );

    expect(result).toEqual({
      score: 100,
      matchedCount: 2,
      totalCount: 2,
    });
  });
});
