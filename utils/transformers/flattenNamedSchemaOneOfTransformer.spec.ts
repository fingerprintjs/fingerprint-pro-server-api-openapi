import { flattenNamedSchemaOneOfTransformer } from './flattenNamedSchemaOneOfTransformer.ts';
import type { OpenApiDocument } from '../openapi.ts';

function eventUnionSchema(): OpenApiDocument {
  return {
    components: {
      schemas: {
        EventSource: { type: 'string', enum: ['device', 'edge'] },
        EventDevice: {
          type: 'object',
          required: ['event_id', 'source'],
          properties: {
            event_id: { type: 'string' },
            source: {
              $ref: '#/components/schemas/EventSource',
              const: 'device',
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
            source: { $ref: '#/components/schemas/EventSource', const: 'edge' },
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
        EventRuleAction: {
          oneOf: [{ $ref: '#/components/schemas/Allow' }, { $ref: '#/components/schemas/Block' }],
        },
        Allow: { type: 'object', properties: { type: { const: 'allow' } } },
        Block: { type: 'object', properties: { type: { const: 'block' } } },
      },
    },
  };
}

describe('flattenNamedSchemaOneOfTransformer', () => {
  it('merges the named oneOf into one object', () => {
    const schema = eventUnionSchema();

    flattenNamedSchemaOneOfTransformer('Event')(schema);

    const event = schema.components.schemas.Event;
    expect(event.oneOf).toBeUndefined();
    expect(event.discriminator).toBeUndefined();
    expect(Object.keys(event.properties)).toEqual(['event_id', 'source', 'identification', 'ip_info']);
    expect(event.required).toEqual(['event_id', 'source']);
  });

  it('keeps the discriminator as a plain $ref with the earlier variant x-platforms', () => {
    const schema = eventUnionSchema();

    flattenNamedSchemaOneOfTransformer('Event')(schema);

    expect(schema.components.schemas.Event.properties.source).toEqual({
      $ref: '#/components/schemas/EventSource',
      'x-platforms': ['android', 'ios', 'browser'],
    });
  });

  it('drops optionalProperties from required', () => {
    const schema = eventUnionSchema();

    flattenNamedSchemaOneOfTransformer('Event', { optionalProperties: ['source'] })(schema);

    expect(schema.components.schemas.Event.required).toEqual(['event_id']);
  });

  it('does not touch other oneOf schemas', () => {
    const schema = eventUnionSchema();
    const original = structuredClone(schema.components.schemas.EventRuleAction);

    flattenNamedSchemaOneOfTransformer('Event')(schema);

    expect(schema.components.schemas.EventRuleAction).toEqual(original);
  });

  it('does nothing when the named schema has no oneOf', () => {
    const schema: OpenApiDocument = {
      components: { schemas: { Event: { type: 'object', properties: { event_id: { type: 'string' } } } } },
    };
    const original = structuredClone(schema);

    flattenNamedSchemaOneOfTransformer('Event')(schema);

    expect(schema).toEqual(original);
  });
});
