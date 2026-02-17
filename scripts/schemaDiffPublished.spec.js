import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runSchemaDiffPublished } from './schemaDiffPublished.js';

function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'schema-diff-published-test-'));
}

function writeSchema(localDir, fileName, content) {
  fs.mkdirSync(localDir, { recursive: true });
  fs.writeFileSync(path.join(localDir, fileName), content, 'utf8');
}

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

  it('fails when remote fetch is not successful', async () => {
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
            status: 404,
            text: async () => '',
          }),
        }
      )
    ).rejects.toThrow('HTTP 404');
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
