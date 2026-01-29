import { replaceOneOf } from './replaceOneOf.js';

describe('Test replaceOneOf', () => {
  it('merges oneOf schemas and makes unique properties optional', () => {
    const schema = {
      oneOf: [
        {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              const: 'allow',
            },
            request_header_modifications: {
              type: 'object',
            },
          },
          required: ['type'],
        },
        {
          type: 'object',
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
          },
          required: ['type'],
        },
      ],
    };

    replaceOneOf(schema, {}, 'oneOf');

    expect(schema).toEqual({
      type: 'object',
      properties: {
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
      },
      required: ['type'],
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

  it('makes properties optional if they only appear in one schema', () => {
    const schema = {
      oneOf: [
        {
          type: 'object',
          properties: {
            common: { type: 'string' },
            unique1: { type: 'string' },
          },
          required: ['common', 'unique1'],
        },
        {
          type: 'object',
          properties: {
            common: { type: 'string' },
            unique2: { type: 'string' },
          },
          required: ['common', 'unique2'],
        },
      ],
    };

    replaceOneOf(schema, {}, 'oneOf');

    expect(schema.required).toEqual(['common']);
    expect(schema.properties.unique1).toBeDefined();
    expect(schema.properties.unique2).toBeDefined();
  });

  it('requires a property only when all schemas require it', () => {
    const schema = {
      oneOf: [
        {
          type: 'object',
          properties: {
            shared: { type: 'string' },
          },
          required: ['shared'],
        },
        {
          type: 'object',
          properties: {
            shared: { type: 'string' },
          },
          required: [],
        },
      ],
    };

    replaceOneOf(schema, {}, 'oneOf');

    expect(schema.required).toBeUndefined();
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

  it('converts const properties to enum when multiple schemas have const values', () => {
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
              const: 'block',
            },
          },
        },
        {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              const: 'redirect',
            },
          },
        },
      ],
    };

    replaceOneOf(schema, {}, 'oneOf');

    expect(schema.properties.action).toEqual({
      type: 'string',
      enum: ['allow', 'block', 'redirect'],
    });
  });

  it('does not convert to enum if not all schemas have const values', () => {
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
            },
          },
        },
      ],
    };

    replaceOneOf(schema, {}, 'oneOf');

    expect(schema.properties.action).toEqual({
      type: 'string',
    });
  });

  it('deduplicates const values when converting to enum', () => {
    const schema = {
      oneOf: [
        {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              const: 'active',
            },
          },
        },
        {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              const: 'active',
            },
          },
        },
        {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              const: 'inactive',
            },
          },
        },
      ],
    };

    replaceOneOf(schema, {}, 'oneOf');

    expect(schema.properties.status).toEqual({
      type: 'string',
      enum: ['active', 'inactive'],
    });
  });
});
