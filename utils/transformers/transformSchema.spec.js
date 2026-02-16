import fs from 'fs';
import {
  transformSchema,
  v4Transformers,
  v4SchemaForSdksTransformers,
  v4SchemaForSdksNormalizedTransformers,
} from './transformSchema.js';

const v4Schema = fs.readFileSync('./schemas/fingerprint-server-api-v4.yaml');

function hasYamlKey(yamlContent, key) {
  const pattern = new RegExp(`^\\s*${key}\\s*:`, 'm');
  return pattern.test(yamlContent);
}

describe('Test transformSchema pipelines for v4', () => {
  it('base v4 schema keeps examples, oneOf, and additionalProperties', () => {
    const result = transformSchema(v4Schema, v4Transformers);

    expect(hasYamlKey(result, 'examples')).toBe(true);
    expect(hasYamlKey(result, 'oneOf')).toBe(true);
    expect(hasYamlKey(result, 'additionalProperties')).toBe(true);
  });

  it('v4 sdk schema removes examples and additionalProperties while keeping oneOf operators', () => {
    const result = transformSchema(v4Schema, v4SchemaForSdksTransformers);

    expect(hasYamlKey(result, 'examples')).toBe(false);
    expect(hasYamlKey(result, 'additionalProperties')).toBe(false);
    expect(hasYamlKey(result, 'oneOf')).toBe(true);
  });

  it('v4 normalized sdk schema removes examples, additionalProperties and composition operators', () => {
    const result = transformSchema(v4Schema, v4SchemaForSdksNormalizedTransformers);

    expect(hasYamlKey(result, 'examples')).toBe(false);
    expect(hasYamlKey(result, 'additionalProperties')).toBe(false);
    expect(hasYamlKey(result, 'oneOf')).toBe(false);
    expect(hasYamlKey(result, 'anyOf')).toBe(false);
  });
});
