import fs from 'fs';
import { transformSchema } from './transformSchema.js';
import { removeFieldTransformer } from './removeFieldTransformer.js';

const simpleYaml = fs.readFileSync('./utils/mocks/simple.yaml');
const simpleWithAdditionalProperties = fs.readFileSync('./utils/mocks/simpleWithAdditionalProperties.yaml');
const simpleWithAdditionalPropertiesCleaned = fs.readFileSync(
  './utils/mocks/simpleWithAdditionalPropertiesCleaned.yaml'
);
const schemaWithXReadme = fs.readFileSync('./utils/mocks/schemaWithXReadme.yaml');
const schemaWithXReadmeCleaned = fs.readFileSync('./utils/mocks/schemaWithXReadmeCleaned.yaml');

const removeReadmeFromSchema = (yaml) => transformSchema(yaml, [removeFieldTransformer('x-readme')]);
const removeAdditionalPropertiesFalseFromSchema = (yaml) =>
  transformSchema(yaml, [removeFieldTransformer('additionalProperties', false)]);
describe('Test removeFieldTransformer', () => {
  it('don`t need to do anything', () => {
    const result = removeReadmeFromSchema(simpleYaml);
    expect(result.toString()).toEqual(simpleYaml.toString());
  });

  it('need to remove x-readme', () => {
    const result = removeReadmeFromSchema(schemaWithXReadme);
    expect(result.toString()).toEqual(schemaWithXReadmeCleaned.toString());
  });

  it('removes field only when value matches expectedValue', () => {
    const result = removeAdditionalPropertiesFalseFromSchema(simpleWithAdditionalProperties);
    expect(result.toString()).toEqual(simpleWithAdditionalPropertiesCleaned.toString());
  });
});
