import fs from 'fs';
import { extractFirstParameterExampleTransformer } from './extractFirstParameterExampleTransformer.ts';
import { transformSchema } from './transformSchema.ts';

const simpleYaml = fs.readFileSync('./utils/mocks/simple.yaml');
const schemaWithExamples = fs.readFileSync('./utils/mocks/schemaWithExamples.yaml');
const schemaWithExamplesNormalized = fs.readFileSync('./utils/mocks/schemaWithExamplesNormalized.yaml');

const cleanSchema = (yaml: string | Buffer) => transformSchema(yaml, [extractFirstParameterExampleTransformer]);
describe('extractFirstParameterExampleTransformer', () => {
  it("don't need to do anything", () => {
    const result = cleanSchema(simpleYaml);
    expect(result.toString()).toEqual(simpleYaml.toString());
  });

  it('extracts first parameter example', () => {
    const result = cleanSchema(schemaWithExamples);
    expect(result.toString()).toEqual(schemaWithExamplesNormalized.toString());
  });
});
