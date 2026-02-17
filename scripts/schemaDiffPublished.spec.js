import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseArgs, runSchemaDiffPublished } from './schemaDiffPublished.js';

function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'schema-diff-published-test-'));
}

function writeSchema(localDir, fileName, content) {
  fs.mkdirSync(localDir, { recursive: true });
  fs.writeFileSync(path.join(localDir, fileName), content, 'utf8');
}

describe('parseArgs', () => {
  it('ignores argument separator passed by package managers', () => {
    const options = parseArgs(['--', '--json-out', 'report.json', '--comment-out', 'comment.md']);

    expect(options).toMatchObject({
      jsonOut: 'report.json',
      commentOut: 'comment.md',
    });
  });

  it('parses --known-remote-files as comma-separated list', () => {
    const options = parseArgs(['--known-remote-files', 'a.yaml,b.yaml,c.yaml']);

    expect(options.knownRemoteFiles).toEqual(['a.yaml', 'b.yaml', 'c.yaml']);
  });

  it('handles --known-remote-files with equals syntax', () => {
    const options = parseArgs(['--known-remote-files=one.yaml, two.yaml']);

    expect(options.knownRemoteFiles).toEqual(['one.yaml', 'two.yaml']);
  });
});

describe('runSchemaDiffPublished', () => {
  it('writes report and no-change comment when schemas are identical', async () => {
    const rootDir = createTempDir();
    const localDir = path.join(rootDir, 'dist/schemas');
    const jsonOut = path.join(rootDir, 'report.json');
    const commentOut = path.join(rootDir, 'comment.md');
    const schema = `openapi: 3.0.3
info:
  title: API
  version: '1.0'
`;
    writeSchema(localDir, 'sample.yaml', schema);

    const report = await runSchemaDiffPublished(
      {
        localDir,
        baseUrl: 'https://schemas.example.test',
        jsonOut,
        commentOut,
      },
      {
        fetchImpl: async () => ({
          ok: true,
          status: 200,
          text: async () => schema,
        }),
        now: () => new Date('2026-02-17T12:00:00.000Z'),
      }
    );

    expect(report.changedCount).toBe(0);
    expect(fs.existsSync(jsonOut)).toBe(true);
    expect(fs.existsSync(commentOut)).toBe(true);
    const comment = fs.readFileSync(commentOut, 'utf8');
    expect(comment).toContain('No schema changes detected');
  });

  it('generates a patch for changed schemas', async () => {
    const rootDir = createTempDir();
    const localDir = path.join(rootDir, 'dist/schemas');
    const commentOut = path.join(rootDir, 'comment.md');
    const schemaRemote = `openapi: 3.0.3
info:
  title: Old API
  version: '1.0'
`;
    const schemaLocal = `openapi: 3.0.3
info:
  title: New API
  version: '1.0'
`;
    writeSchema(localDir, 'sample.yaml', schemaLocal);

    const report = await runSchemaDiffPublished(
      {
        localDir,
        baseUrl: 'https://schemas.example.test',
        commentOut,
      },
      {
        fetchImpl: async () => ({
          ok: true,
          status: 200,
          text: async () => schemaRemote,
        }),
        now: () => new Date('2026-02-17T12:00:00.000Z'),
      }
    );

    expect(report.changedCount).toBe(1);
    expect(report.files[0].patch).toContain('@@');
    expect(report.files[0].summary.modifiedCount).toBeGreaterThan(0);
  });

  it('treats 404 as new schema instead of failing', async () => {
    const rootDir = createTempDir();
    const localDir = path.join(rootDir, 'dist/schemas');
    const commentOut = path.join(rootDir, 'comment.md');
    const schemaLocal = `openapi: 3.0.3
info:
  title: New API
  version: '1.0'
`;
    writeSchema(localDir, 'sample.yaml', schemaLocal);

    const report = await runSchemaDiffPublished(
      {
        localDir,
        baseUrl: 'https://schemas.example.test',
        commentOut,
      },
      {
        fetchImpl: async () => ({
          ok: false,
          status: 404,
          text: async () => '',
        }),
        now: () => new Date('2026-02-17T12:00:00.000Z'),
      }
    );

    expect(report.changedCount).toBe(1);
    expect(report.newFiles).toEqual(['sample.yaml']);
    expect(report.files[0].isNew).toBe(true);
    expect(report.files[0].changed).toBe(true);
    const comment = fs.readFileSync(commentOut, 'utf8');
    expect(comment).toContain('NEW');
  });

  it('fails when remote fetch returns non-404 error', async () => {
    const rootDir = createTempDir();
    const localDir = path.join(rootDir, 'dist/schemas');
    writeSchema(localDir, 'sample.yaml', 'openapi: 3.0.3\n');

    await expect(
      runSchemaDiffPublished(
        {
          localDir,
          baseUrl: 'https://schemas.example.test',
        },
        {
          fetchImpl: async () => ({
            ok: false,
            status: 500,
            text: async () => '',
          }),
        }
      )
    ).rejects.toThrow('HTTP 500');
  });

  it('detects deleted schemas when knownRemoteFiles is provided', async () => {
    const rootDir = createTempDir();
    const localDir = path.join(rootDir, 'dist/schemas');
    const commentOut = path.join(rootDir, 'comment.md');
    const schema = `openapi: 3.0.3
info:
  title: API
  version: '1.0'
`;
    writeSchema(localDir, 'existing.yaml', schema);

    const report = await runSchemaDiffPublished(
      {
        localDir,
        baseUrl: 'https://schemas.example.test',
        knownRemoteFiles: ['existing.yaml', 'deleted.yaml'],
        commentOut,
      },
      {
        fetchImpl: async () => ({
          ok: true,
          status: 200,
          text: async () => schema,
        }),
        now: () => new Date('2026-02-17T12:00:00.000Z'),
      }
    );

    expect(report.changedCount).toBe(1);
    expect(report.deletedFiles).toEqual(['deleted.yaml']);
    const deletedFile = report.files.find((f) => f.fileName === 'deleted.yaml');
    expect(deletedFile.isDeleted).toBe(true);
    expect(deletedFile.changed).toBe(true);
    const comment = fs.readFileSync(commentOut, 'utf8');
    expect(comment).toContain('DELETED');
  });

  it('fails on invalid YAML content', async () => {
    const rootDir = createTempDir();
    const localDir = path.join(rootDir, 'dist/schemas');
    writeSchema(localDir, 'sample.yaml', 'openapi: 3.0.3\n');

    await expect(
      runSchemaDiffPublished(
        {
          localDir,
          baseUrl: 'https://schemas.example.test',
        },
        {
          fetchImpl: async () => ({
            ok: true,
            status: 200,
            text: async () => 'openapi: [broken',
          }),
        }
      )
    ).rejects.toThrow('Unable to parse YAML');
  });
});
