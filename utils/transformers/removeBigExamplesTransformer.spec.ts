import fs from 'fs';
import { removeBigExamplesTransformer } from './removeBigExamplesTransformer.ts';
import { transformSchema } from './transformSchema.ts';

const simpleYaml = fs.readFileSync('./utils/mocks/simple.yaml');
const schemaWithExamples = fs.readFileSync('./utils/mocks/schemaWithExamples.yaml');
const schemaWithExamplesCleaned = fs.readFileSync('./utils/mocks/schemaWithExamplesCleaned.yaml');

const cleanSchema = (yaml: string | Buffer) => transformSchema(yaml, [removeBigExamplesTransformer]);
describe('Test removeBigExamplesTransformer', () => {
  it('don`t need to do anything', () => {
    const result = cleanSchema(simpleYaml);
    expect(result.toString()).toEqual(simpleYaml.toString());
  });

  it('need to remove big examples', () => {
    const result = cleanSchema(schemaWithExamples);
    expect(result.toString()).toEqual(schemaWithExamplesCleaned.toString());
  });
});
