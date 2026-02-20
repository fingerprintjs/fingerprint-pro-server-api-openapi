import fs from 'fs';
import { transformSchema } from './transformSchema.js';
import { liftOneOfSharedPropertiesTransformer } from './liftOneOfSharedPropertiesTransformer.js';

const schemaWithOneOffSiblingProperties = fs.readFileSync('./utils/mocks/schemaWithOneOffSiblingProperties.yaml');
const schemaWithOneOffSiblingPropertiesLifted = fs.readFileSync(
  './utils/mocks/schemaWithOneOffSiblingPropertiesLifted.yaml'
);

const applyTransformer = (yaml) => transformSchema(yaml, [liftOneOfSharedPropertiesTransformer]);

describe('Test liftOneOfSharedPropertiesTransformer', () => {
  it('extracts oneOf sibling properties into a shared base and injects it into variants using allOf', () => {
    const result = applyTransformer(schemaWithOneOffSiblingProperties);
    expect(result.toString()).toEqual(schemaWithOneOffSiblingPropertiesLifted.toString());
  });
});
