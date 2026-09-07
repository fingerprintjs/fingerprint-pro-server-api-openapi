import { SCHEMA_DIFF_COMMENT_MARKER, renderSchemaDiffComment } from './renderComment.ts';

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
            addedElements: ['/z/new-a', '/z/new-b'],
            removedElements: [],
            modifiedElements: ['/z/old'],
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
            addedElements: [],
            removedElements: ['/a/remove'],
            modifiedElements: ['/a/update'],
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
    expect(output).toContain('<summary>Added elements (2)</summary>');
    expect(output).toContain('`/z/new-a`');
    expect(output).toContain('`/z/new-b`');
    expect(output).toContain('```diff');
    expect(output).toContain('@@ -2 +2 @@');
  });

  it('omits patch details when the comment would exceed the GitHub limit', () => {
    const report = {
      generatedAt: '2026-02-17T00:00:00.000Z',
      baseUrl: 'https://example.com/schemas',
      comparedCount: 1,
      changedCount: 1,
      files: [
        {
          fileName: 'large.yaml',
          remoteUrl: 'https://example.com/schemas/large.yaml',
          changed: true,
          summary: {
            addedElements: ['/new'],
            removedElements: [],
            modifiedElements: ['/changed'],
            addedCount: 1,
            removedCount: 0,
            modifiedCount: 1,
          },
          patch: `@@ -1 +1 @@\n-${'a'.repeat(70_000)}\n+b`,
        },
      ],
    };

    const output = renderSchemaDiffComment(report);

    expect(Buffer.byteLength(output, 'utf8')).toBeLessThanOrEqual(65_536);
    expect(output).toContain('Summary: +1 added, -0 removed, ~1 modified');
    expect(output).toContain('Detailed changed-lines patches were omitted');
    expect(output).not.toContain('```diff');
  });

  it('omits element lists when they would exceed the GitHub limit', () => {
    const report = {
      generatedAt: '2026-02-17T00:00:00.000Z',
      baseUrl: 'https://example.com/schemas',
      comparedCount: 1,
      changedCount: 1,
      files: [
        {
          fileName: 'large.yaml',
          remoteUrl: 'https://example.com/schemas/large.yaml',
          changed: true,
          summary: {
            addedElements: Array.from({ length: 7_000 }, (_, index) => `/new/${index}`),
            removedElements: [],
            modifiedElements: [],
            addedCount: 7_000,
            removedCount: 0,
            modifiedCount: 0,
          },
          patch: '@@ -1 +1 @@\n-a\n+b',
        },
      ],
    };

    const output = renderSchemaDiffComment(report);

    expect(Buffer.byteLength(output, 'utf8')).toBeLessThanOrEqual(65_536);
    expect(output).toContain('Summary: +7000 added, -0 removed, ~0 modified');
    expect(output).toContain('Element lists and changed-lines patches were omitted');
    expect(output).not.toContain('`/new/0`');
  });

  it('renders a minimal report when per-schema summaries would exceed the GitHub limit', () => {
    const report = {
      generatedAt: '2026-02-17T00:00:00.000Z',
      baseUrl: 'https://example.com/schemas',
      comparedCount: 1,
      changedCount: 1,
      files: [
        {
          fileName: `${'a'.repeat(70_000)}.yaml`,
          remoteUrl: 'https://example.com/schemas/large.yaml',
          changed: true,
          summary: {
            addedElements: [],
            removedElements: [],
            modifiedElements: [],
            addedCount: 0,
            removedCount: 0,
            modifiedCount: 0,
          },
          patch: '',
        },
      ],
    };

    const output = renderSchemaDiffComment(report);

    expect(Buffer.byteLength(output, 'utf8')).toBeLessThanOrEqual(65_536);
    expect(output).toContain('Per-schema details were omitted');
    expect(output).toContain('Changed schemas: `1` of `1`');
    expect(output).not.toContain('.yaml');
  });

  it('renders new schema with NEW label', () => {
    const report = {
      generatedAt: '2026-02-17T00:00:00.000Z',
      baseUrl: 'https://example.com/schemas',
      comparedCount: 1,
      changedCount: 1,
      newFiles: ['new.yaml'],
      deletedFiles: [],
      files: [
        {
          fileName: 'new.yaml',
          remoteUrl: 'https://example.com/schemas/new.yaml',
          changed: true,
          isNew: true,
          isDeleted: false,
          summary: {
            addedElements: ['/info'],
            removedElements: [],
            modifiedElements: [],
            addedCount: 1,
            removedCount: 0,
            modifiedCount: 0,
          },
          patch: '@@ +1 @@\n+openapi: 3.0.3',
        },
      ],
    };

    const output = renderSchemaDiffComment(report);

    expect(output).toContain('### `new.yaml` 🆕 NEW');
    expect(output).toContain('(1 new)');
    expect(output).not.toContain('Published URL:');
  });

  it('renders deleted schema with DELETED label', () => {
    const report = {
      generatedAt: '2026-02-17T00:00:00.000Z',
      baseUrl: 'https://example.com/schemas',
      comparedCount: 1,
      changedCount: 1,
      newFiles: [],
      deletedFiles: ['old.yaml'],
      files: [
        {
          fileName: 'old.yaml',
          remoteUrl: 'https://example.com/schemas/old.yaml',
          changed: true,
          isNew: false,
          isDeleted: true,
          summary: {
            addedElements: [],
            removedElements: ['/'],
            modifiedElements: [],
            addedCount: 0,
            removedCount: 1,
            modifiedCount: 0,
          },
          patch: '',
        },
      ],
    };

    const output = renderSchemaDiffComment(report);

    expect(output).toContain('### `old.yaml` 🗑️ DELETED');
    expect(output).toContain('(1 deleted)');
    expect(output).toContain('has been **deleted**');
  });
});
