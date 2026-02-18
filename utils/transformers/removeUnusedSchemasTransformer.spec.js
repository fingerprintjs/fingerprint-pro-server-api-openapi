import fs from 'fs';
import { transformSchema } from './transformSchema.js';
import { removeUnusedSchemasTransformer } from './removeUnusedSchemasTransformer.js';

const simpleYaml = fs.readFileSync('./utils/mocks/simple.yaml');
const schemaWithUnusedSchemas = fs.readFileSync('./utils/mocks/schemaWithUnusedSchemas.yaml');
const schemaWithUnusedSchemasCleaned = fs.readFileSync('./utils/mocks/schemaWithUnusedSchemasCleaned.yaml');

const cleanSchema = (yaml) => transformSchema(yaml, [removeUnusedSchemasTransformer]);

describe('Test removeUnusedSchemasTransformer', () => {
  it('does nothing when all schemas are referenced', () => {
    const result = cleanSchema(simpleYaml);
    expect(result.toString()).toEqual(simpleYaml.toString());
  });

  it('removes unreferenced schemas', () => {
    const result = cleanSchema(schemaWithUnusedSchemas);
    expect(result.toString()).toEqual(schemaWithUnusedSchemasCleaned.toString());
  });
});
