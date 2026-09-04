import { flattenNamedSchemaOneOfTransformer } from './flattenNamedSchemaOneOfTransformer.ts';
import type { OpenApiDocument } from '../openapi.ts';

const apply = (schema: OpenApiDocument, schemaName = 'Event', optionalProperties?: string[]) => {
  const options = optionalProperties === undefined ? {} : { optionalProperties };
  flattenNamedSchemaOneOfTransformer(schemaName, options)(schema);
  return schema;
};

describe('flattenNamedSchemaOneOfTransformer', () => {
  it('merges a named oneOf into one object and can leave source optional', () => {
    const schema: OpenApiDocument = {
      components: {
        schemas: {
          EventSource: {
            type: 'string',
            enum: ['device', 'edge'],
          },
          EventDevice: {
            type: 'object',
            required: ['event_id', 'source'],
            properties: {
              event_id: { type: 'string' },
              source: {
                allOf: [{ $ref: '#/components/schemas/EventSource' }, { const: 'device' }],
                'x-platforms': ['android', 'ios', 'browser'],
              },
              identification: { type: 'object' },
            },
          },
          EventEdge: {
            type: 'object',
            required: ['event_id', 'source', 'ip_info'],
            properties: {
              event_id: { type: 'string' },
              source: {
                allOf: [{ $ref: '#/components/schemas/EventSource' }, { const: 'edge' }],
              },
              ip_info: { type: 'object' },
            },
          },
          Event: {
            oneOf: [{ $ref: '#/components/schemas/EventDevice' }, { $ref: '#/components/schemas/EventEdge' }],
            discriminator: {
              propertyName: 'source',
              mapping: {
                device: '#/components/schemas/EventDevice',
                edge: '#/components/schemas/EventEdge',
              },
            },
          },
        },
      },
    };

    apply(schema, 'Event', ['source']);

    const event = schema.components.schemas.Event;
    expect(event.oneOf).toBeUndefined();
    expect(event.discriminator).toBeUndefined();
    expect(event.properties.identification).toBeDefined();
    expect(event.properties.ip_info).toBeDefined();
    expect(event.properties.source).toEqual({
      $ref: '#/components/schemas/EventSource',
      'x-platforms': ['android', 'ios', 'browser'],
    });
    expect(event.properties.source.enum).toBeUndefined();
    expect(event.required).toEqual(['event_id']);
  });

  it('keeps x-platforms from EventDevice when EventEdge omits them', () => {
    const schema: OpenApiDocument = {
      components: {
        schemas: {
          EventDevice: {
            type: 'object',
            properties: {
              url: { type: 'string', 'x-platforms': ['browser'] },
              ip_info: { type: 'object', 'x-platforms': ['android', 'ios', 'browser'] },
            },
          },
          EventEdge: {
            type: 'object',
            properties: {
              url: { type: 'string' },
              ip_info: { type: 'object' },
            },
          },
          Event: {
            oneOf: [{ $ref: '#/components/schemas/EventDevice' }, { $ref: '#/components/schemas/EventEdge' }],
          },
        },
      },
    };

    apply(schema);

    const event = schema.components.schemas.Event;
    expect(event.properties.url['x-platforms']).toEqual(['browser']);
    expect(event.properties.ip_info['x-platforms']).toEqual(['android', 'ios', 'browser']);
  });

  it('does not modify other oneOf schemas', () => {
    const schema: OpenApiDocument = {
      components: {
        schemas: {
          Event: {
            type: 'object',
            properties: { event_id: { type: 'string' } },
          },
          EventRuleAction: {
            oneOf: [{ $ref: '#/components/schemas/Allow' }, { $ref: '#/components/schemas/Block' }],
          },
          Allow: { type: 'object', properties: { type: { const: 'allow' } } },
          Block: { type: 'object', properties: { type: { const: 'block' } } },
        },
      },
    };
    const original = structuredClone(schema);

    apply(schema);

    expect(schema).toEqual(original);
  });

  it('flattens Event without flattening EventRuleAction', () => {
    const schema: OpenApiDocument = {
      components: {
        schemas: {
          EventDevice: {
            type: 'object',
            properties: { event_id: { type: 'string' } },
          },
          EventEdge: {
            type: 'object',
            properties: { event_id: { type: 'string' } },
          },
          Event: {
            oneOf: [{ $ref: '#/components/schemas/EventDevice' }, { $ref: '#/components/schemas/EventEdge' }],
          },
          EventRuleAction: {
            oneOf: [{ $ref: '#/components/schemas/Allow' }, { $ref: '#/components/schemas/Block' }],
          },
          Allow: { type: 'object', properties: { type: { const: 'allow' } } },
          Block: { type: 'object', properties: { type: { const: 'block' } } },
        },
      },
    };

    apply(schema);

    expect(schema.components.schemas.Event.oneOf).toBeUndefined();
    expect(schema.components.schemas.Event.properties.event_id).toBeDefined();
    expect(schema.components.schemas.EventRuleAction.oneOf).toEqual([
      { $ref: '#/components/schemas/Allow' },
      { $ref: '#/components/schemas/Block' },
    ]);
  });
});
