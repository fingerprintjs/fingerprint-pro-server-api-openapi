// @ts-check
import fs from 'fs';
import {
  transformSchema,
  v4Transformers,
  v4SchemaForSdksTransformers,
  v4SchemaForSdksNormalizedTransformers,
} from './transformSchema.js';
import { parseYaml } from './parseYaml.js';

const v4Schema = fs.readFileSync('./schemas/fingerprint-server-api-v4.yaml');

/** @param {Buffer | string} yamlContent */
/** @param {string} key */
function hasYamlKey(yamlContent, key) {
  const pattern = new RegExp(`^\\s*${key}\\s*:`, 'm');
  return pattern.test(yamlContent);
}

const extractedPathOperationEnumComponentsToCheck = {
  bot: 'SearchEventsBot',
  vpn_confidence: 'SearchEventsVpnConfidence',
  sdk_platform: 'SearchEventsSdkPlatform',
};

/**
 * Asserts that path-operation inline enums have been extracted into component references
 * @param {Array<{name: string, schema: unknown}>} parameters
 * @param {Record<string, unknown>} schemas - parsed.components.schemas
 */
function expectPathOperationInlineEnumsExtractedToComponents(parameters, schemas) {
  for (const [parameterName, componentName] of Object.entries(extractedPathOperationEnumComponentsToCheck)) {
    const parameter = parameters.find((item) => item.name === parameterName);
    expect(parameter).toBeDefined();
    expect(parameter && parameter.schema).toEqual({ $ref: `#/components/schemas/${componentName}` });
    expect(schemas[componentName]).toBeTruthy();
  }
}

describe('Test transformSchema pipelines for v4', () => {
  it('base v4 schema keeps examples, oneOf, and additionalProperties', () => {
    const result = transformSchema(v4Schema, v4Transformers);

    expect(hasYamlKey(result, 'examples')).toBe(true);
    expect(hasYamlKey(result, 'oneOf')).toBe(true);
    expect(hasYamlKey(result, 'additionalProperties')).toBe(true);

    const parsed = parseYaml(result);
    const getEventsParamenters = parsed.paths['/events'].get.parameters;
    const botParameter = getEventsParamenters.find((item) => item.name === 'bot');

    // Inline enums are still inline
    expect(botParameter.schema.enum).toEqual(['all', 'good', 'bad', 'none']);
    expect(parsed.components.schemas.BotEnum).toBeUndefined();
  });

  it('v4 sdk schema removes examples and additionalProperties while keeping oneOf operators', () => {
    const result = transformSchema(v4Schema, v4SchemaForSdksTransformers);

    expect(hasYamlKey(result, 'examples')).toBe(false);
    expect(hasYamlKey(result, 'additionalProperties')).toBe(false);
    expect(hasYamlKey(result, 'oneOf')).toBe(true);

    const parsed = parseYaml(result);
    const getEventsParamenters = parsed.paths['/events'].get.parameters;
    expectPathOperationInlineEnumsExtractedToComponents(getEventsParamenters, parsed.components.schemas);
  });

  it('v4 normalized sdk schema removes examples, additionalProperties, composition operators and path-operation inline enums', () => {
    const result = transformSchema(v4Schema, v4SchemaForSdksNormalizedTransformers);

    expect(hasYamlKey(result, 'examples')).toBe(false);
    expect(hasYamlKey(result, 'additionalProperties')).toBe(false);
    expect(hasYamlKey(result, 'oneOf')).toBe(false);
    expect(hasYamlKey(result, 'anyOf')).toBe(false);

    const parsed = parseYaml(result);
    const parameters = parsed.paths['/events'].get.parameters;
    expectPathOperationInlineEnumsExtractedToComponents(parameters, parsed.components.schemas);

    expect(parsed.components.schemas.EventRuleAction.properties.type).toEqual({
      type: 'string',
      description: 'Describes the action to take with the request.',
      enum: ['allow', 'block'],
    });
  });
});
