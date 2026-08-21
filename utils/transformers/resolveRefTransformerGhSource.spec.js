import fs from 'fs';
import path from 'path';
import { resolveRefTransformer, toKoalaPath } from './resolveRefTransformer.js';
import { transformSchema } from './transformSchema.js';

const mocksPath = './utils/mocks';

const resolveRef = (yaml, schemaPath) => transformSchema(yaml, [resolveRefTransformer({ schemaPath })]);
const resolveRefWithGhSource = (yaml, schemaPath) =>
  transformSchema(yaml, [resolveRefTransformer({ schemaPath, addGhSource: true })]);

describe('Test resolveRefTransformer x-gh-source', () => {
  it('does not add x-gh-source by default', () => {
    const input = fs.readFileSync('./utils/mocks/schemaWithExternalRef.yaml');
    const result = resolveRef(input, mocksPath);
    expect(result).not.toContain('x-gh-source');
  });

  it('adds x-gh-source to inlined path operations and component schemas', () => {
    const input = fs.readFileSync('./utils/mocks/schemaWithExternalRef.yaml');
    const result = resolveRefWithGhSource(input, mocksPath);
    expect(result).toContain('x-gh-source');
    // path operation inlined from paths/visitors.yml
    expect(result).toContain('x-gh-source: api/v4/paths/visitors.yml');
    // component schemas inlined from ../components/Response.yaml and Error.yaml
    expect(result).toContain('x-gh-source: api/v4/components/Response.yaml');
    expect(result).toContain('x-gh-source: api/v4/components/Error.yaml');
  });

  it('strips leading ./ from ref paths before mapping', () => {
    const yaml = `
openapi: 3.0.3
info:
  title: Test API
  version: '0.1'
paths:
  /visitors/{visitor_id}:
    $ref: ./paths/visitors.yml
`;
    const result = resolveRefWithGhSource(yaml, mocksPath);
    expect(result).toContain('x-gh-source: api/v4/paths/visitors.yml');
  });

  it('maps the root entrypoint file to api/v4/server-api.yaml', () => {
    const tmpDir = fs.mkdtempSync('gh-source-test-');
    const targetPath = path.join(tmpDir, 'fingerprint-server-api-v4.yaml');
    fs.writeFileSync(targetPath, `type: object\ntitle: Root\nproperties:\n  ok:\n    type: boolean\n`);
    const input = `
openapi: 3.0.3
info:
  title: Test API
  version: '0.1'
paths: {}
components:
  schemas:
    Root:
      $ref: fingerprint-server-api-v4.yaml
`;
    const result = resolveRefWithGhSource(input, tmpDir);
    expect(result).toContain('x-gh-source: api/v4/server-api.yaml');
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('preserves existing schema fields when adding x-gh-source', () => {
    const input = fs.readFileSync('./utils/mocks/schemaWithExternalRef.yaml');
    const result = resolveRefWithGhSource(input, mocksPath);
    // The Response schema should still have its title and properties
    expect(result).toContain('title: Response');
    expect(result).toContain('visitorId');
  });
});

describe('Test toKoalaPath', () => {
  it('maps components/ paths to api/v4/components/', () => {
    expect(toKoalaPath('components/Response.yaml')).toBe('api/v4/components/Response.yaml');
    expect(toKoalaPath('components/nested/Error.yml')).toBe('api/v4/components/nested/Error.yml');
  });

  it('maps paths/ paths to api/v4/paths/', () => {
    expect(toKoalaPath('paths/visitors.yml')).toBe('api/v4/paths/visitors.yml');
    expect(toKoalaPath('paths/events/search.yaml')).toBe('api/v4/paths/events/search.yaml');
  });

  it('maps the root entrypoint file to api/v4/server-api.yaml', () => {
    expect(toKoalaPath('fingerprint-server-api-v4.yaml')).toBe('api/v4/server-api.yaml');
  });

  it('strips a leading ./ prefix before mapping', () => {
    expect(toKoalaPath('./components/Response.yaml')).toBe('api/v4/components/Response.yaml');
    expect(toKoalaPath('./paths/visitors.yml')).toBe('api/v4/paths/visitors.yml');
    expect(toKoalaPath('./fingerprint-server-api-v4.yaml')).toBe('api/v4/server-api.yaml');
  });

  it('passes through anything else unchanged (after stripping ./)', () => {
    expect(toKoalaPath('something/else/entirely.yaml')).toBe('something/else/entirely.yaml');
    expect(toKoalaPath('./top-level-file.yaml')).toBe('top-level-file.yaml');
    expect(toKoalaPath('components-not-a-prefix.yaml')).toBe('components-not-a-prefix.yaml');
  });
});
