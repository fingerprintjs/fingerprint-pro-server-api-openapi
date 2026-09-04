import fs from 'fs';
import { parseYaml, toYaml } from './parseYaml.ts';
import {
  transformSchema,
  v4Transformers,
  v4SchemaForSdksTransformers,
  v4SchemaForSdksFlatTransformers,
  v4SchemaForSdksNormalizedTransformers,
} from './transformSchema.ts';
import type { OpenApiDocument } from '../openapi.ts';

const v4Schema = fs.readFileSync('./schemas/fingerprint-server-api-v4.yaml');

function hasYamlKey(yamlContent: Buffer | string, key: string, value?: unknown): boolean {
  const pattern = new RegExp(value !== undefined ? `^\\s*${key}\\s*:\\s*${value}\\s*$` : `^\\s*${key}\\s*:`, 'm');
  return pattern.test(yamlContent as string);
}

function hasResponseExamples(parsed: OpenApiDocument): boolean {
  const paths = parsed.paths || {};
  for (const pathItem of Object.values<any>(paths)) {
    for (const operation of Object.values<any>(pathItem)) {
      const responses = operation && operation.responses;
      if (!responses) continue;
      for (const response of Object.values<any>(responses)) {
        const content = (response && response.content) || {};
        for (const mediaType of Object.values<any>(content)) {
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
 */
function expectPathOperationInlineEnumsExtractedToComponents(
  parameters: Array<{ name: string; schema: unknown }>,
  schemas: Record<string, unknown>
) {
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
    const botParameter = getEventsParamenters.find((item: any) => item.name === 'bot');

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

  it('v4 docs and Node SDK schemas keep Event as EventDevice | EventEdge', () => {
    for (const transformers of [v4Transformers, v4SchemaForSdksTransformers]) {
      const parsed = parseYaml(transformSchema(v4Schema, transformers));
      const event = parsed.components.schemas.Event;

      expect(event.oneOf).toEqual([
        { $ref: '#/components/schemas/EventDevice' },
        { $ref: '#/components/schemas/EventEdge' },
      ]);
      expect(event.discriminator).toEqual({
        propertyName: 'source',
        mapping: {
          device: '#/components/schemas/EventDevice',
          edge: '#/components/schemas/EventEdge',
        },
      });
      expect(parsed.components.schemas.EventDevice.properties.source).toEqual({
        allOf: [
          { $ref: '#/components/schemas/EventSource' },
          { const: 'device', 'x-platforms': ['android', 'ios', 'browser'] },
        ],
      });
      expect(parsed.components.schemas.EventEdge.properties.source).toEqual({
        allOf: [{ $ref: '#/components/schemas/EventSource' }, { const: 'edge' }],
      });
      expect(parsed.components.schemas.EventDevice.properties.ip_info).toBeDefined();
      expect(parsed.components.schemas.EventEdge.properties.ip_info).toBeDefined();
      expect(parsed.components.schemas.EventDevice.properties.identification).toBeDefined();
      expect(parsed.components.schemas.EventEdge.properties.identification).toBeUndefined();
      expect(parsed.paths['/edge']).toBeDefined();
      expect(parsed.paths['/events/{event_id}'].get.description).toContain(
        'Use `source` to tell identification events (`device`) from Automation Intelligence events (`edge`).'
      );
      expect(parsed.paths['/events/{event_id}'].get.description).not.toContain('EventDevice');
    }
  });

  it('v4 flat and normalized SDK schemas flatten Event and keep source optional', () => {
    for (const transformers of [v4SchemaForSdksFlatTransformers, v4SchemaForSdksNormalizedTransformers]) {
      const parsed = parseYaml(transformSchema(v4Schema, transformers));
      const event = parsed.components.schemas.Event;

      expect(event.oneOf).toBeUndefined();
      expect(event.discriminator).toBeUndefined();
      expect(event.properties.identification).toBeDefined();
      expect(event.properties.ip_info).toBeDefined();
      expect(event.properties.source).toEqual({
        $ref: '#/components/schemas/EventSource',
        'x-platforms': ['android', 'ios', 'browser'],
      });
      expect(event.required).toEqual(expect.arrayContaining(['event_id', 'timestamp']));
      expect(event.required).not.toContain('source');
      expect(parsed.components.schemas.EventEdge.properties.ip_info).toBeDefined();
      expect(parsed.components.schemas.EventDevice).toBeUndefined();
      expect(parsed.paths['/edge']).toBeDefined();
      expect(parsed.paths['/events/{event_id}'].get.description).toContain(
        'Use `source` to tell identification events (`device`) from Automation Intelligence events (`edge`).'
      );
      expect(parsed.paths['/events/{event_id}'].get.description).not.toContain('EventDevice');
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

  it('v4 sdk schemas keep /edge', () => {
    const yamlWithEdge = toYaml({
      openapi: '3.1.1',
      paths: { '/edge': { post: {} }, '/events': { get: {} } },
      components: { schemas: {} },
    });

    for (const transformers of [
      v4SchemaForSdksTransformers,
      v4SchemaForSdksFlatTransformers,
      v4SchemaForSdksNormalizedTransformers,
    ]) {
      const parsed = parseYaml(transformSchema(yamlWithEdge, transformers));
      expect(parsed.paths['/edge']).toBeDefined();
    }
  });
});
