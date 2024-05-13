import fs from 'fs';
import { transformSchema } from './transformSchema.js';
import { removeDeleteVisitorTransformer } from './removeDeleteVisitorTransformer.js';

const simpleYaml = fs.readFileSync('./utils/mocks/simple.yaml');
const simpleWithDelete = fs.readFileSync('./utils/mocks/simpleWithDelete.yaml');

const removeDeleteVisitor = (yaml) => transformSchema(yaml, [removeDeleteVisitorTransformer]);
describe('Test removeDeleteVisitorTransformer', () => {
  it('don`t need to do anything', () => {
    const result = removeDeleteVisitor(simpleYaml);
    expect(result.toString()).toEqual(simpleYaml.toString());
  });

  it('need to remove delete endpoint', () => {
    const result = removeDeleteVisitor(simpleWithDelete);
    expect(result.toString()).toEqual(simpleYaml.toString());
  });
});
