import fs from 'fs';
import yaml from 'js-yaml';
import {
  transformSchema,
  v4Transformers,
  v4SchemaForSdksTransformers,
  v4SchemaForSdksNormalizedTransformers,
} from './transformSchema.js';

const v4Schema = fs.readFileSync('./schemas/fingerprint-server-api-v4.yaml');
const eventFilterComponentMap = {
  bot: 'BotEnum',
  vpn_confidence: 'VpnConfidenceEnum',
  sdk_platform: 'SdkPlatformEnum',
};

function hasYamlKey(yamlContent, key) {
  const pattern = new RegExp(`^\\s*${key}\\s*:`, 'm');
  return pattern.test(yamlContent);
}

describe('Test transformSchema pipelines for v4', () => {
  it('base v4 schema keeps examples, oneOf, and additionalProperties', () => {
    const result = transformSchema(v4Schema, v4Transformers);
    const parsed = yaml.load(result);
    const parameters = parsed.paths['/events'].get.parameters;
    const botParameter = parameters.find((item) => item.name === 'bot');

    expect(hasYamlKey(result, 'examples')).toBe(true);
    expect(hasYamlKey(result, 'oneOf')).toBe(true);
    expect(hasYamlKey(result, 'additionalProperties')).toBe(true);
    expect(botParameter.schema.enum).toEqual(['all', 'good', 'bad', 'none']);
    expect(parsed.components.schemas.BotEnum).toBeUndefined();
  });

  it('v4 sdk schema removes examples and additionalProperties while keeping oneOf operators', () => {
    const result = transformSchema(v4Schema, v4SchemaForSdksTransformers);
    const parsed = yaml.load(result);
    const parameters = parsed.paths['/events'].get.parameters;

    expect(hasYamlKey(result, 'examples')).toBe(false);
    expect(hasYamlKey(result, 'additionalProperties')).toBe(false);
    expect(hasYamlKey(result, 'oneOf')).toBe(true);

    Object.entries(eventFilterComponentMap).forEach(([parameterName, componentName]) => {
      const parameter = parameters.find((item) => item.name === parameterName);
      expect(parameter.schema).toEqual({ $ref: `#/components/schemas/${componentName}` });
      expect(parsed.components.schemas[componentName]).toBeTruthy();
    });
  });

  it('v4 normalized sdk schema removes examples, additionalProperties and composition operators', () => {
    const result = transformSchema(v4Schema, v4SchemaForSdksNormalizedTransformers);
    const parsed = yaml.load(result);
    const parameters = parsed.paths['/events'].get.parameters;

    expect(hasYamlKey(result, 'examples')).toBe(false);
    expect(hasYamlKey(result, 'additionalProperties')).toBe(false);
    expect(hasYamlKey(result, 'oneOf')).toBe(false);
    expect(hasYamlKey(result, 'anyOf')).toBe(false);

    Object.entries(eventFilterComponentMap).forEach(([parameterName, componentName]) => {
      const parameter = parameters.find((item) => item.name === parameterName);
      expect(parameter.schema).toEqual({ $ref: `#/components/schemas/${componentName}` });
      expect(parsed.components.schemas[componentName]).toBeTruthy();
    });
  });
});
