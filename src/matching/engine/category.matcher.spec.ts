import { CategoryMatcher } from './category.matcher';

describe('CategoryMatcher', () => {
  let matcher: CategoryMatcher;

  beforeEach(() => {
    matcher = new CategoryMatcher();
  });

  it('should be defined', () => {
    expect(matcher).toBeDefined();
  });

  it('should return 100 when all project categories match', () => {
    const result = matcher.match(
      ['cat-1', 'cat-2', 'cat-3'],
      ['cat-1', 'cat-3'],
    );

    expect(result).toEqual({
      score: 100,
      matchedCount: 2,
      totalCount: 2,
    });
  });

  it('should calculate partial match correctly', () => {
    const result = matcher.match(['cat-1', 'cat-2'], ['cat-1', 'cat-3']);

    expect(result).toEqual({
      score: 50,
      matchedCount: 1,
      totalCount: 2,
    });
  });

  it('should return 0 when no category matches', () => {
    const result = matcher.match(['cat-1', 'cat-2'], ['cat-3', 'cat-4']);

    expect(result).toEqual({
      score: 0,
      matchedCount: 0,
      totalCount: 2,
    });
  });

  it('should return null score when project has no categories', () => {
    const result = matcher.match(['cat-1', 'cat-2'], []);

    expect(result).toEqual({
      score: null,
      matchedCount: 0,
      totalCount: 0,
    });
  });

  it('should ignore duplicate project categories', () => {
    const result = matcher.match(['cat-1'], ['cat-1', 'cat-1', 'cat-2']);

    expect(result).toEqual({
      score: 50,
      matchedCount: 1,
      totalCount: 2,
    });
  });

  it('should not depend on the number of user categories', () => {
    const result = matcher.match(
      ['cat-1', 'cat-2', 'cat-3', 'cat-4', 'cat-5'],
      ['cat-1', 'cat-2'],
    );

    expect(result).toEqual({
      score: 100,
      matchedCount: 2,
      totalCount: 2,
    });
  });
});
