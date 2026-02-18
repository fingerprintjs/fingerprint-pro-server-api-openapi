import { replaceOneOf } from './replaceOneOf.js';

describe('Test replaceOneOf', () => {
  it('merges oneOf schemas and makes unique properties optional (EventRuleAction schema)', () => {
    // This test uses the exact structure from EventRuleAction.yaml
    const schema = {
      type: 'object',
      description:
        'Describes the action the client should take, according to the rule in the ruleset that matched the event.',
      required: ['ruleset_id'],
      properties: {
        ruleset_id: { type: 'string' },
        rule_id: { type: 'string' },
        rule_expression: { type: 'string' },
      },
      oneOf: [
        // EventRuleActionAllow.yaml
        {
          type: 'object',
          required: ['type'],
          properties: {
            type: {
              type: 'string',
              const: 'allow',
            },
            request_header_modifications: {
              type: 'object',
            },
          },
        },
        // EventRuleActionBlock.yaml
        {
          type: 'object',
          required: ['type'],
          properties: {
            type: {
              type: 'string',
              const: 'block',
            },
            status_code: {
              type: 'number',
            },
            headers: {
              type: 'array',
            },
            body: {
              type: 'string',
            },
          },
        },
      ],
      discriminator: {
        propertyName: 'type',
        mapping: {
          allow: 'EventRuleActionAllow.yaml',
          block: 'EventRuleActionBlock.yaml',
        },
      },
    };

    replaceOneOf(schema, {}, 'oneOf');

    expect(schema).toEqual({
      type: 'object',
      description:
        'Describes the action the client should take, according to the rule in the ruleset that matched the event.',
      required: ['ruleset_id', 'type'],
      properties: {
        ruleset_id: { type: 'string' },
        rule_id: { type: 'string' },
        rule_expression: { type: 'string' },
        type: {
          type: 'string',
          enum: ['allow', 'block'],
        },
        request_header_modifications: {
          type: 'object',
        },
        status_code: {
          type: 'number',
        },
        headers: {
          type: 'array',
        },
        body: {
          type: 'string',
        },
      },
      additionalProperties: false,
    });
  });

  it('handles $ref in oneOf schemas', () => {
    const schema = {
      oneOf: [
        {
          $ref: '#/components/schemas/Allow',
        },
        {
          $ref: '#/components/schemas/Block',
        },
      ],
    };

    const components = {
      Allow: {
        type: 'object',
        properties: {
          type: { type: 'string' },
          allowProp: { type: 'string' },
        },
        required: ['type'],
      },
      Block: {
        type: 'object',
        properties: {
          type: { type: 'string' },
          blockProp: { type: 'string' },
        },
        required: ['type'],
      },
    };

    replaceOneOf(schema, components, 'oneOf');

    expect(schema).toEqual({
      type: 'object',
      properties: {
        type: { type: 'string' },
        allowProp: { type: 'string' },
        blockProp: { type: 'string' },
      },
      required: ['type'],
      additionalProperties: false,
    });
  });

  it('only requires properties that are required in all schemas', () => {
    const schema = {
      oneOf: [
        {
          type: 'object',
          properties: {
            alwaysRequired: { type: 'string' },
            sometimesRequired: { type: 'string' },
            unique1: { type: 'string' },
          },
          required: ['alwaysRequired', 'sometimesRequired', 'unique1'],
        },
        {
          type: 'object',
          properties: {
            alwaysRequired: { type: 'string' },
            sometimesRequired: { type: 'string' },
            unique2: { type: 'string' },
          },
          required: ['alwaysRequired', 'unique2'],
        },
      ],
    };

    replaceOneOf(schema, {}, 'oneOf');

    expect(schema.required).toEqual(['alwaysRequired']);
    expect(schema.properties.sometimesRequired).toBeDefined();
    expect(schema.properties.unique1).toBeDefined();
    expect(schema.properties.unique2).toBeDefined();
  });

  it('handles anyOf operator', () => {
    const schema = {
      anyOf: [
        {
          type: 'object',
          properties: {
            prop1: { type: 'string' },
          },
        },
        {
          type: 'object',
          properties: {
            prop2: { type: 'string' },
          },
        },
      ],
    };

    replaceOneOf(schema, {}, 'anyOf');

    expect(schema.anyOf).toBeUndefined();
    expect(schema.properties.prop1).toBeDefined();
    expect(schema.properties.prop2).toBeDefined();
    expect(schema.required).toBeUndefined();
  });

  it('handles empty oneOf array', () => {
    const schema = {
      oneOf: [],
      type: 'object',
    };

    replaceOneOf(schema, {}, 'oneOf');

    expect(schema.oneOf).toBeUndefined();
  });

  it('converts const properties to deduplicated enum when all schemas have const values', () => {
    const schema = {
      oneOf: [
        {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              const: 'allow',
            },
          },
        },
        {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              const: 'allow', // duplicate value
            },
          },
        },
        {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              const: 'block',
            },
          },
        },
      ],
    };

    replaceOneOf(schema, {}, 'oneOf');

    expect(schema.properties.action).toEqual({
      type: 'string',
      enum: ['allow', 'block'],
    });
  });

  it('converts enum properties to deduplicated enum when all schemas have enum values', () => {
    const schema = {
      oneOf: [
        {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['allow'],
            },
          },
        },
        {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['block'],
            },
          },
        },
      ],
    };

    replaceOneOf(schema, {}, 'oneOf');

    expect(schema.properties.action).toEqual({
      type: 'string',
      enum: ['allow', 'block'],
    });
  });

  it('converts mixed const/enum properties to deduplicated enum when all schemas are constrained', () => {
    const schema = {
      oneOf: [
        {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              const: 'allow',
            },
          },
        },
        {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['block'],
            },
          },
        },
      ],
    };

    replaceOneOf(schema, {}, 'oneOf');

    expect(schema.properties.action).toEqual({
      type: 'string',
      enum: ['allow', 'block'],
    });
  });

  it('does not convert to enum and removes const when only some schemas have const values', () => {
    // Test with const first, then without
    const schema1 = {
      oneOf: [
        {
          type: 'object',
          properties: {
            action: { type: 'string', const: 'allow' },
          },
        },
        {
          type: 'object',
          properties: {
            action: { type: 'string' },
          },
        },
      ],
    };

    // Test with non-const first, then const (order shouldn't matter)
    const schema2 = {
      oneOf: [
        {
          type: 'object',
          properties: {
            action: { type: 'string' },
          },
        },
        {
          type: 'object',
          properties: {
            action: { type: 'string', const: 'allow' },
          },
        },
      ],
    };

    replaceOneOf(schema1, {}, 'oneOf');
    replaceOneOf(schema2, {}, 'oneOf');

    expect(schema1.properties.action).toEqual({ type: 'string' });
    expect(schema2.properties.action).toEqual({ type: 'string' });
  });

  it('removes enum when only some schemas have enum values', () => {
    const schema1 = {
      oneOf: [
        {
          type: 'object',
          properties: {
            action: { type: 'string', enum: ['allow'] },
          },
        },
        {
          type: 'object',
          properties: {
            action: { type: 'string' },
          },
        },
      ],
    };

    const schema2 = {
      oneOf: [
        {
          type: 'object',
          properties: {
            action: { type: 'string' },
          },
        },
        {
          type: 'object',
          properties: {
            action: { type: 'string', enum: ['allow'] },
          },
        },
      ],
    };

    replaceOneOf(schema1, {}, 'oneOf');
    replaceOneOf(schema2, {}, 'oneOf');

    expect(schema1.properties.action).toEqual({ type: 'string' });
    expect(schema2.properties.action).toEqual({ type: 'string' });
  });

  it('does not mutate original referenced schemas when using $ref', () => {
    const schema = {
      oneOf: [{ $ref: '#/components/schemas/Allow' }, { $ref: '#/components/schemas/Block' }],
    };

    const components = {
      Allow: {
        type: 'object',
        properties: {
          type: { type: 'string', const: 'allow' },
          allowProp: { type: 'string' },
        },
        required: ['type'],
      },
      Block: {
        type: 'object',
        properties: {
          type: { type: 'string', const: 'block' },
          blockProp: { type: 'string' },
        },
        required: ['type'],
      },
    };

    // Deep clone to compare after mutation
    const originalAllow = structuredClone(components.Allow);
    const originalBlock = structuredClone(components.Block);

    replaceOneOf(schema, components, 'oneOf');

    // Verify the merged schema has expected result
    expect(schema.properties.type).toEqual({
      type: 'string',
      enum: ['allow', 'block'],
    });

    // Verify original schemas were NOT mutated
    expect(components.Allow).toEqual(originalAllow);
    expect(components.Block).toEqual(originalBlock);
  });

  it('preserves parent additionalProperties when set', () => {
    const schema = {
      additionalProperties: true,
      oneOf: [
        {
          type: 'object',
          additionalProperties: false,
          properties: {
            prop: { type: 'string' },
          },
        },
      ],
    };

    replaceOneOf(schema, {}, 'oneOf');

    expect(schema.additionalProperties).toBe(true);
  });
});
