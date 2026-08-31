import fs from 'fs';
import { inlineReferencedPropertiesTransformer } from './inlineReferencedPropertiesTransformer.ts';
import { transformSchema } from './transformSchema.ts';

const simpleYaml = fs.readFileSync('./utils/mocks/simple.yaml');
const schemaWithUnusedSchemas = fs.readFileSync('./utils/mocks/schemaWithUnusedSchemas.yaml');
const schemaWithUnusedSchemasInlined = fs.readFileSync('./utils/mocks/schemaWithUnusedSchemasInlined.yaml');

const applyTransformer = (yaml: Buffer, parentName?: string) =>
  transformSchema(yaml, [inlineReferencedPropertiesTransformer(parentName as string)]);

describe('Test inlineReferencedPropertiesTransformer', () => {
  it("doesn't do anything when no properties use $ref", () => {
    const result = applyTransformer(simpleYaml);
    expect(result.toString()).toEqual(simpleYaml.toString());
  });

  it('inlines $ref properties only within the named schema', () => {
    const result = applyTransformer(schemaWithUnusedSchemas, 'UnusedSchemaB');
    expect(result.toString()).toEqual(schemaWithUnusedSchemasInlined.toString());
  });
});
