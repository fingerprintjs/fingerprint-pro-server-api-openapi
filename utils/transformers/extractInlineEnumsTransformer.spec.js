import fs from 'fs';
import { transformSchema } from './transformSchema.js';
import { extractInlineEnumsTransformer } from './extractInlineEnumsTransformer.js';

const simpleYaml = fs.readFileSync('./utils/mocks/simple.yaml');
const schemaWithInlineEnums = fs.readFileSync('./utils/mocks/schemaWithInlineEnums.yaml');
const schemaWithInlineEnumsExtracted = fs.readFileSync('./utils/mocks/schemaWithInlineEnumsExtracted.yaml');

const extractInlineEnums = (yaml) => transformSchema(yaml, [extractInlineEnumsTransformer]);

describe('Test extractInlineEnumsTransformer', () => {
  it('don`t need to do anything', () => {
    const result = extractInlineEnums(simpleYaml);
    expect(result.toString()).toEqual(simpleYaml.toString());
  });

  it('extracts inline enums into components', () => {
    const result = extractInlineEnums(schemaWithInlineEnums);
    expect(result.toString()).toEqual(schemaWithInlineEnumsExtracted.toString());
  });
});
