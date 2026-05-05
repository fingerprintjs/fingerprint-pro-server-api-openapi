import fs from 'fs';
import { transformSchema } from './transformSchema.js';
import { removeFieldByPathTransformer } from './removeFieldByPathTransformer.js';

const simpleYaml = fs.readFileSync('./utils/mocks/simple.yaml');
const schemaWithXReadme = fs.readFileSync('./utils/mocks/schemaWithXReadme.yaml');
const schemaWithXReadmeCleaned = fs.readFileSync('./utils/mocks/schemaWithXReadmeCleaned.yaml');
describe('Test removeFieldByPathTransformer', () => {
  it("doesn't do anything when path doesn't exist", () => {
    const result = transformSchema(simpleYaml, [
      removeFieldByPathTransformer(['components', 'schemas', 'Response', 'nonexistent']),
    ]);
    expect(result.toString()).toEqual(simpleYaml.toString());
  });

  it('removes a field at an exact nested path', () => {
    const result = transformSchema(schemaWithXReadme, [
      removeFieldByPathTransformer(['paths', '/visitors/{visitor_id}', 'get', 'x-readme']),
    ]);
    expect(result.toString()).toEqual(schemaWithXReadmeCleaned.toString());
  });

  it('removes a field from array elements using a wildcard segment', () => {
    const result = transformSchema(simpleYaml, [
      removeFieldByPathTransformer(['servers', '*', 'description']),
    ]);
    expect(result).not.toContain('Global');
    expect(result).toContain('https://api.fpjs.io');
  });
});
