import { SCHEMA_DIFF_COMMENT_MARKER, renderSchemaDiffComment } from './renderComment.js';

describe('renderSchemaDiffComment', () => {
  it('renders a no-change message when there are no changed schemas', () => {
    const report = {
      generatedAt: '2026-02-17T00:00:00.000Z',
      baseUrl: 'https://example.com/schemas',
      comparedCount: 2,
      changedCount: 0,
      files: [],
    };

    const output = renderSchemaDiffComment(report);

    expect(output).toContain(SCHEMA_DIFF_COMMENT_MARKER);
    expect(output).toContain('Changed schemas: `0`');
    expect(output).toContain('No schema changes detected');
  });

  it('renders changed schemas in deterministic order with patch details', () => {
    const report = {
      generatedAt: '2026-02-17T00:00:00.000Z',
      baseUrl: 'https://example.com/schemas',
      comparedCount: 2,
      changedCount: 2,
      files: [
        {
          fileName: 'z.yaml',
          remoteUrl: 'https://example.com/schemas/z.yaml',
          changed: true,
          summary: {
            addedPaths: ['/z/new-a', '/z/new-b'],
            removedPaths: [],
            modifiedPaths: ['/z/old'],
            addedCount: 2,
            removedCount: 0,
            modifiedCount: 1,
          },
          patch: '@@ -1 +1 @@\n-a\n+b',
        },
        {
          fileName: 'a.yaml',
          remoteUrl: 'https://example.com/schemas/a.yaml',
          changed: true,
          summary: {
            addedPaths: [],
            removedPaths: ['/a/remove'],
            modifiedPaths: ['/a/update'],
            addedCount: 0,
            removedCount: 1,
            modifiedCount: 1,
          },
          patch: '@@ -2 +2 @@\n-x\n+y',
        },
      ],
    };

    const output = renderSchemaDiffComment(report);

    expect(output).toContain('### `a.yaml`');
    expect(output).toContain('### `z.yaml`');
    expect(output.indexOf('### `a.yaml`')).toBeLessThan(output.indexOf('### `z.yaml`'));
    expect(output).toContain('<details>');
    expect(output).toContain('<summary>Added paths (2)</summary>');
    expect(output).toContain('`/z/new-a`');
    expect(output).toContain('`/z/new-b`');
    expect(output).toContain('```diff');
    expect(output).toContain('@@ -2 +2 @@');
  });
});
