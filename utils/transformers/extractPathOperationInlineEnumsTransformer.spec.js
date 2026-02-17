import fs from 'fs';
import { transformSchema } from './transformSchema.js';
import { extractPathOperationInlineEnumsTransformer } from './extractPathOperationInlineEnumsTransformer.js';

const simpleYaml = fs.readFileSync('./utils/mocks/simple.yaml');
const schemaWithPathOperationInlineEnums = fs.readFileSync('./utils/mocks/schemaWithPathOperationInlineEnums.yaml');
const schemaWithPathOperationInlineEnumsExtracted = fs.readFileSync(
  './utils/mocks/schemaWithPathOperationInlineEnumsExtracted.yaml'
);

const extractPathOperationInlineEnums = (yaml) => transformSchema(yaml, [extractPathOperationInlineEnumsTransformer]);

describe('Test extractPathOperationInlineEnumsTransformer', () => {
  it('does not modify schema without path operation inline enums', () => {
    const result = extractPathOperationInlineEnums(simpleYaml);
    expect(result.toString()).toEqual(simpleYaml.toString());
  });

  it('extracts inline enums only in operations and isolates equivalent enums per operation', () => {
    const result = extractPathOperationInlineEnums(schemaWithPathOperationInlineEnums);
    expect(result.toString()).toEqual(schemaWithPathOperationInlineEnumsExtracted.toString());
  });
});
