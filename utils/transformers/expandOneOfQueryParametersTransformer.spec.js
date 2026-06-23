import fs from 'fs';
import { transformSchema } from './transformSchema.js';
import { expandOneOfQueryParametersTransformer } from './expandOneOfQueryParametersTransformer.js';

const simpleYaml = fs.readFileSync('./utils/mocks/simple.yaml');
const schemaWithOneOfQueryParameter = fs.readFileSync('./utils/mocks/schemaWithOneOfQueryParameter.yaml');
const schemaWithOneOfQueryParameterTransformed = fs.readFileSync(
  './utils/mocks/schemaWithOneOfQueryParameterTransformed.yaml'
);

const replacementParametersMap = {
  timestamp: {
    overrideDescription: 'The updated description',
    alias: {
      name: 'timestamp_alias',
      description: 'The description for the alias',
    },
  },
};

const applyTransformer = (yaml) =>
  transformSchema(yaml, [expandOneOfQueryParametersTransformer(replacementParametersMap)]);

describe('Test expandOneOfQueryParametersTransformer', () => {
  it('does not modify schema without oneOf query parameters', () => {
    const result = applyTransformer(simpleYaml);
    expect(result.toString()).toEqual(simpleYaml.toString());
  });

  it('expands oneOf query parameters into separate parameters', () => {
    const result = applyTransformer(schemaWithOneOfQueryParameter);
    expect(result.toString()).toEqual(schemaWithOneOfQueryParameterTransformed.toString());
  });
});
