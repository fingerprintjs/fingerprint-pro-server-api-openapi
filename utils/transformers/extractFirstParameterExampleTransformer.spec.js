import fs from 'fs';
import { transformSchema } from './transformSchema.js';
import { extractFirstParameterExampleTransformer } from './extractFirstParameterExampleTransformer.js';

const simpleYaml = fs.readFileSync('./utils/mocks/simple.yaml');
const schemaWithExamples = fs.readFileSync('./utils/mocks/schemaWithExamples.yaml');
const schemaWithExamplesNormalized = fs.readFileSync('./utils/mocks/schemaWithExamplesNormalized.yaml');

const cleanSchema = (yaml) => transformSchema(yaml, [extractFirstParameterExampleTransformer]);
describe('extractFirstParameterExampleTransformer', () => {
  it('don`t need to do anything', () => {
    const result = cleanSchema(simpleYaml);
    expect(result.toString()).toEqual(simpleYaml.toString());
  });

  it('extracts first parameter example', () => {
    const result = cleanSchema(schemaWithExamples);
    expect(result.toString()).toEqual(schemaWithExamplesNormalized.toString());
  });
});
