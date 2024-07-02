import fs from 'fs';
import { transformSchema } from './transformSchema.js';
import { appendExternalSchemaRefTransformer } from './appendExternalSchemaRefTransformer.js';

const simpleYaml = fs.readFileSync('./utils/mocks/simple.yaml');
const simpleButExternalSchema = fs.readFileSync('./utils/mocks/simpleButExternalSchemaReference.yaml');

const appendExternalReferences = (yaml) =>
  transformSchema(yaml, [(apiDefinition) => appendExternalSchemaRefTransformer(apiDefinition, './utils/mocks')]);

describe('Test appendExternalSchemaRefTransformer', () => {
  it('don`t need to do anything', () => {
    const result = appendExternalReferences(simpleYaml);
    expect(result.toString()).toEqual(simpleYaml.toString());
  });

  it('need to append external references big examples', () => {
    const result = appendExternalReferences(simpleButExternalSchema);
    expect(result.toString()).toEqual(simpleYaml.toString());
  });
});
