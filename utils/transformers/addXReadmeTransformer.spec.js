import fs from 'fs';
import { transformSchema } from './transformSchema.js';
import { addXReadmeTransformer } from './addXReadmeTransformer.js';

const simpleYaml = fs.readFileSync('./utils/mocks/simple.yaml');
const simpleWithXReadmeYaml = fs.readFileSync('./utils/mocks/simpleWithXReadme.yaml');

const addXReadme = (yaml, readmeSources) => transformSchema(yaml, [addXReadmeTransformer(readmeSources)]);

describe('Test addXReadmeTransformer', () => {
  it('append x-readme', () => {
    const result = addXReadme(simpleYaml, ['./utils/mocks/x-readme/oneMethod.yaml']);
    expect(result.toString()).toEqual(simpleWithXReadmeYaml.toString());
  });
});
