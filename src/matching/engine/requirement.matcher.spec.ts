import { RequirementMatcher } from './requirement.matcher';

describe('RequirementMatcher', () => {
  let matcher: RequirementMatcher;

  const catalog = [
    {
      id: 'c-1',
      name: 'React',
      fieldId: 'field-frontend',
    },
    {
      id: 'c-2',
      name: 'TypeScript',
      fieldId: 'field-frontend',
    },
    {
      id: 'c-3',
      name: 'Java',
      fieldId: 'field-backend',
    },
    {
      id: 'c-4',
      name: 'Spring Boot',
      fieldId: 'field-backend',
    },
    {
      id: 'c-5',
      name: 'PHP',
      fieldId: 'field-backend',
    },
  ];

  beforeEach(() => {
    matcher = new RequirementMatcher();
  });

  it('should be defined', () => {
    expect(matcher).toBeDefined();
  });

  it('should match YES criterion when user has the contribution', () => {
    const result = matcher.matchRequirement(
      {
        id: 'req-1',
        criteria: [
          {
            status: 'YES',
            term: 'React',
          },
        ],
      },
      [
        {
          id: 'uc-1',
          contributionId: 'c-1',
          name: 'React',
        },
      ],
      catalog,
    );

    expect(result).toEqual({
      requirementId: 'req-1',
      score: 100,
      matchedCount: 1,
      evaluableCount: 1,
      criteria: [
        {
          status: 'YES',
          term: 'React',
          result: 'MATCH',
        },
      ],
    });
  });

  it('should return NOT_MATCH when YES criterion is not satisfied', () => {
    const result = matcher.matchRequirement(
      {
        id: 'req-1',
        criteria: [
          {
            status: 'YES',
            term: 'Java',
          },
        ],
      },
      [
        {
          id: 'uc-1',
          contributionId: 'c-1',
          name: 'React',
        },
      ],
      catalog,
    );

    expect(result).toEqual({
      requirementId: 'req-1',
      score: 0,
      matchedCount: 0,
      evaluableCount: 1,
      criteria: [
        {
          status: 'YES',
          term: 'Java',
          result: 'NOT_MATCH',
        },
      ],
    });
  });

  it('should match NO criterion when user does not have the contribution', () => {
    const result = matcher.matchRequirement(
      {
        id: 'req-1',
        criteria: [
          {
            status: 'NO',
            term: 'PHP',
          },
        ],
      },
      [
        {
          id: 'uc-1',
          contributionId: 'c-1',
          name: 'React',
        },
      ],
      catalog,
    );

    expect(result).toEqual({
      requirementId: 'req-1',
      score: 100,
      matchedCount: 1,
      evaluableCount: 1,
      criteria: [
        {
          status: 'NO',
          term: 'PHP',
          result: 'MATCH',
        },
      ],
    });
  });

  it('should return NOT_MATCH when user violates NO criterion', () => {
    const result = matcher.matchRequirement(
      {
        id: 'req-1',
        criteria: [
          {
            status: 'NO',
            term: 'PHP',
          },
        ],
      },
      [
        {
          id: 'uc-1',
          contributionId: 'c-5',
          name: 'PHP',
        },
      ],
      catalog,
    );

    expect(result).toEqual({
      requirementId: 'req-1',
      score: 0,
      matchedCount: 0,
      evaluableCount: 1,
      criteria: [
        {
          status: 'NO',
          term: 'PHP',
          result: 'NOT_MATCH',
        },
      ],
    });
  });

  it('should return UNKNOWN for a term that is not in the contribution catalog', () => {
    const result = matcher.matchRequirement(
      {
        id: 'req-1',
        criteria: [
          {
            status: 'YES',
            term: 'Startup experience',
          },
        ],
      },
      [],
      catalog,
    );

    expect(result).toEqual({
      requirementId: 'req-1',
      score: null,
      matchedCount: 0,
      evaluableCount: 0,
      criteria: [
        {
          status: 'YES',
          term: 'Startup experience',
          result: 'UNKNOWN',
        },
      ],
    });
  });

  it('should exclude UNKNOWN from denominator', () => {
    const result = matcher.matchRequirement(
      {
        id: 'req-1',
        criteria: [
          {
            status: 'YES',
            term: 'React',
          },
          {
            status: 'YES',
            term: 'Startup experience',
          },
        ],
      },
      [
        {
          id: 'uc-1',
          contributionId: 'c-1',
          name: 'React',
        },
      ],
      catalog,
    );

    expect(result).toEqual({
      requirementId: 'req-1',
      score: 100,
      matchedCount: 1,
      evaluableCount: 1,
      criteria: [
        {
          status: 'YES',
          term: 'React',
          result: 'MATCH',
        },
        {
          status: 'YES',
          term: 'Startup experience',
          result: 'UNKNOWN',
        },
      ],
    });
  });

  it('should normalize whitespace and case', () => {
    const result = matcher.matchRequirement(
      {
        id: 'req-1',
        criteria: [
          {
            status: 'YES',
            term: '  REACT  ',
          },
        ],
      },
      [
        {
          id: 'uc-1',
          contributionId: 'c-1',
          name: 'react',
        },
      ],
      catalog,
    );

    expect(result.score).toBe(100);
    expect(result.matchedCount).toBe(1);
    expect(result.evaluableCount).toBe(1);
  });

  it('should return null when requirement has no evaluable criteria', () => {
    const result = matcher.matchRequirement(
      {
        id: 'req-1',
        criteria: [
          {
            status: 'YES',
            term: 'Startup experience',
          },
        ],
      },
      [],
      catalog,
    );

    expect(result.score).toBeNull();
  });

  it('should choose the maximum valid requirement score', () => {
    const result = matcher.match(
      [
        {
          id: 'req-1',
          criteria: [
            {
              status: 'YES',
              term: 'React',
            },
          ],
        },
        {
          id: 'req-2',
          criteria: [
            {
              status: 'YES',
              term: 'Java',
            },
          ],
        },
      ],
      [
        {
          id: 'uc-1',
          contributionId: 'c-1',
          name: 'React',
        },
      ],
      catalog,
    );

    expect(result).toEqual({
      requirementId: 'req-1',
      score: 100,
      matchedCount: 1,
      evaluableCount: 1,
      criteria: [
        {
          status: 'YES',
          term: 'React',
          result: 'MATCH',
        },
      ],
    });
  });

  it('should ignore invalid empty criteria', () => {
    const result = matcher.matchRequirement(
      {
        id: 'req-1',
        criteria: [
          {
            status: 'YES',
            term: '   ',
          },
          {
            status: 'YES',
            term: 'React',
          },
        ],
      },
      [
        {
          id: 'uc-1',
          contributionId: 'c-1',
          name: 'React',
        },
      ],
      catalog,
    );

    expect(result.score).toBe(100);
    expect(result.matchedCount).toBe(1);
    expect(result.evaluableCount).toBe(1);
  });

  it('should return null when all requirements are unevaluable', () => {
    const result = matcher.match(
      [
        {
          id: 'req-1',
          criteria: [
            {
              status: 'YES',
              term: 'Startup experience',
            },
          ],
        },
        {
          id: 'req-2',
          criteria: [
            {
              status: 'YES',
              term: 'Network education',
            },
          ],
        },
      ],
      [],
      catalog,
    );

    expect(result).toBeNull();
  });
});
