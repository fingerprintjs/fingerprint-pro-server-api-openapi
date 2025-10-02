import fs from 'fs';
import { transformSchema } from './transformSchema.js';
import { removeFieldTransformer } from './removeFieldTransformer.js';

const simpleYaml = fs.readFileSync('./utils/mocks/simple.yaml');
const schemaWithXReadme = fs.readFileSync('./utils/mocks/schemaWithXReadme.yaml');
const schemaWithXReadmeCleaned = fs.readFileSync('./utils/mocks/schemaWithXReadmeCleaned.yaml');

const cleanSchema = (yaml) => transformSchema(yaml, [removeFieldTransformer('x-readme')]);
describe('Test removeFieldTransformer', () => {
  it('don`t need to do anything', () => {
    const result = cleanSchema(simpleYaml);
    expect(result.toString()).toEqual(simpleYaml.toString());
  });

  it('need to remove x-readme', () => {
    const result = cleanSchema(schemaWithXReadme);
    expect(result.toString()).toEqual(schemaWithXReadmeCleaned.toString());
  });
});
