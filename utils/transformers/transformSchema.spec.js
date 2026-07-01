// @ts-check
import fs from 'fs';
import {
  transformSchema,
  v4Transformers,
  v4SchemaForSdksTransformers,
  v4SchemaForSdksNormalizedTransformers,
} from './transformSchema.js';
import { parseYaml, toYaml } from './parseYaml.js';

const v4Schema = fs.readFileSync('./schemas/fingerprint-server-api-v4.yaml');

/** @param {Buffer | string} yamlContent */
/** @param {string} key */
/** @param {unknown=} value */
function hasYamlKey(yamlContent, key, value) {
  const pattern = new RegExp(value !== undefined ? `^\\s*${key}\\s*:\\s*${value}\\s*$` : `^\\s*${key}\\s*:`, 'm');
  return pattern.test(yamlContent);
}

/**
 * @param {Record<string, any>} parsed
 */
function hasResponseExamples(parsed) {
  const paths = parsed.paths || {};
  for (const pathItem of Object.values(paths)) {
    for (const operation of Object.values(pathItem)) {
      const responses = operation && operation.responses;
      if (!responses) continue;
      for (const response of Object.values(responses)) {
        const content = (response && response.content) || {};
        for (const mediaType of Object.values(content)) {
          if (mediaType && mediaType.examples) return true;
        }
      }
    }
  }
  return false;
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

  it('v4 sdk schema removes response examples and additionalProperties: false while keeping schema examples and oneOf operators', () => {
    const result = transformSchema(v4Schema, v4SchemaForSdksTransformers);

    expect(hasYamlKey(result, 'examples')).toBe(true);
    expect(hasYamlKey(result, 'additionalProperties', false)).toBe(false);
    expect(hasYamlKey(result, 'oneOf')).toBe(true);

    const parsed = parseYaml(result);
    expect(hasResponseExamples(parsed)).toBe(false);

    const getEventsParamenters = parsed.paths['/events'].get.parameters;
    expectPathOperationInlineEnumsExtractedToComponents(getEventsParamenters, parsed.components.schemas);

    // This allOf should not be removed
    expect(parsed.components.schemas.EventRuleActionAllow.properties.type).toEqual({
      allOf: [
        {
          $ref: '#/components/schemas/RuleActionType',
        },
        {
          const: 'allow',
        },
      ],
    });
  });

  it('v4 docs schema keeps /edge when present', () => {
    const yamlWithEdge = toYaml({
      openapi: '3.1.1',
      paths: { '/edge': { post: {} }, '/events': { get: {} } },
      components: { schemas: {} },
    });

    const result = transformSchema(yamlWithEdge, [...v4Transformers]);
    const parsed = parseYaml(result);

    expect(parsed.paths['/edge']).toBeDefined();
  });

  it('v4 sdk schemas remove /edge when present', () => {
    const yamlWithEdge = toYaml({
      openapi: '3.1.1',
      paths: { '/edge': { post: {} }, '/events': { get: {} } },
      components: { schemas: {} },
    });

    for (const transformers of [v4SchemaForSdksTransformers, v4SchemaForSdksNormalizedTransformers]) {
      const result = transformSchema(yamlWithEdge, transformers);
      const parsed = parseYaml(result);
      expect(parsed.paths['/edge']).toBeUndefined();
    }
  });

  it('v4 normalized sdk schema removes response examples, additionalProperties: false, oneOf query parameters while keeping schema examples', () => {
    const result = transformSchema(v4Schema, v4SchemaForSdksNormalizedTransformers);

    expect(hasYamlKey(result, 'examples')).toBe(true);
    expect(hasYamlKey(result, 'additionalProperties', false)).toBe(false);

    const parsed = parseYaml(result);
    expect(hasResponseExamples(parsed)).toBe(false);

    const pathsYaml = toYaml(parsed.paths);

    expect(hasYamlKey(pathsYaml, 'oneOf')).toBe(false);
  });
});
