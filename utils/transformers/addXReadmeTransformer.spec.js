import fs from 'fs';
import { addXReadmeTransformer } from './addXReadmeTransformer.js';
import { transformSchema } from './transformSchema.js';

const simpleYaml = fs.readFileSync('./utils/mocks/simple.yaml');
const simpleWithXReadmeYaml = fs.readFileSync('./utils/mocks/simpleWithXReadme.yaml');

const addXReadme = (yaml, readmeSources) => transformSchema(yaml, [addXReadmeTransformer(readmeSources)]);

describe('Test addXReadmeTransformer', () => {
  it('append x-readme', () => {
    const result = addXReadme(simpleYaml, ['./utils/mocks/x-readme/oneMethod.yaml']);
    expect(result.toString()).toEqual(simpleWithXReadmeYaml.toString());
  });
});
