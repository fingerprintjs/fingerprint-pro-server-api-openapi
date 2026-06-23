import fs from 'fs';
import { transformSchema } from './transformSchema.js';
import { removeObjectByPathTransformer } from './removeObjectByPathTransformer.js';

const simpleYaml = fs.readFileSync('./utils/mocks/simple.yaml');
const schemaWithXReadme = fs.readFileSync('./utils/mocks/schemaWithXReadme.yaml');
const schemaWithXReadmeCleaned = fs.readFileSync('./utils/mocks/schemaWithXReadmeCleaned.yaml');

describe('Test removeObjectByPathTransformer', () => {
  it("doesn't do anything when path doesn't exist", () => {
    const result = transformSchema(simpleYaml, [
      removeObjectByPathTransformer(['components', 'schemas', 'Response', 'nonexistent'], () => true),
    ]);
    expect(result.toString()).toEqual(simpleYaml.toString());
  });

  it("doesn't do anything when matcher returns false", () => {
    const result = transformSchema(simpleYaml, [
      removeObjectByPathTransformer(['components', 'schemas', 'Response', 'title'], () => false),
    ]);
    expect(result.toString()).toEqual(simpleYaml.toString());
  });

  it('removes an object key when matcher returns true', () => {
    const result = transformSchema(schemaWithXReadme, [
      removeObjectByPathTransformer(
        ['paths', '/visitors/{visitor_id}', 'get', 'x-readme'],
        (val) => 'code-samples' in val
      ),
    ]);
    expect(result.toString()).toEqual(schemaWithXReadmeCleaned.toString());
  });

  it('splices an array element when matcher returns true', () => {
    const result = transformSchema(simpleYaml, [
      removeObjectByPathTransformer(['servers', '*'], (val) => val.description === 'Global'),
    ]);
    expect(result).not.toContain('Global');
    expect(result).not.toContain('https://api.fpjs.io');
  });
});
