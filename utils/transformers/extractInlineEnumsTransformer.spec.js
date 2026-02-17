import fs from 'fs';
import { transformSchema } from './transformSchema.js';
import { extractInlineEnumsTransformer } from './extractInlineEnumsTransformer.js';

const simpleYaml = fs.readFileSync('./utils/mocks/simple.yaml');
const schemaWithInlineEnums = fs.readFileSync('./utils/mocks/schemaWithInlineEnums.yaml');
const schemaWithInlineEnumsExtracted = fs.readFileSync('./utils/mocks/schemaWithInlineEnumsExtracted.yaml');

const extractInlineEnums = (yaml) => transformSchema(yaml, [extractInlineEnumsTransformer]);

describe('Test extractInlineEnumsTransformer', () => {
  it('does not modify schema without path operation inline enums', () => {
    const result = extractInlineEnums(simpleYaml);
    expect(result.toString()).toEqual(simpleYaml.toString());
  });

  it('extracts inline enums only in operations and isolates equivalent enums per operation', () => {
    const result = extractInlineEnums(schemaWithInlineEnums);
    expect(result.toString()).toEqual(schemaWithInlineEnumsExtracted.toString());
  });
});
