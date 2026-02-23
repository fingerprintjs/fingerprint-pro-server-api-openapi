import fs from 'fs';
import { transformSchema } from './transformSchema.js';
import { liftOneOfSharedPropertiesTransformer } from './liftOneOfSharedPropertiesTransformer.js';

const schemaWithOneOfSiblingProperties = fs.readFileSync('./utils/mocks/schemaWithOneOfSiblingProperties.yaml');
const schemaWithOneOfSiblingPropertiesLifted = fs.readFileSync(
  './utils/mocks/schemaWithOneOfSiblingPropertiesLifted.yaml'
);

const applyTransformer = (schema) => {
  liftOneOfSharedPropertiesTransformer(schema);
  return schema;
};

const applyTransformerToYaml = (yamlContent) => transformSchema(yamlContent, [liftOneOfSharedPropertiesTransformer]);

describe('liftOneOfSharedPropertiesTransformer', () => {
  it('extracts oneOf sibling properties into a shared base and injects it into variants using allOf', () => {
    const result = applyTransformerToYaml(schemaWithOneOfSiblingProperties);
    expect(result.toString()).toEqual(schemaWithOneOfSiblingPropertiesLifted.toString());
  });

  it('does not modify schema without oneOf', () => {
    const schema = {
      components: {
        schemas: {
          Simple: {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
          },
        },
      },
    };
    const original = structuredClone(schema);

    applyTransformer(schema);

    expect(schema).toEqual(original);
  });

  it('does not modify schema with oneOf but no sibling properties', () => {
    const schema = {
      components: {
        schemas: {
          Union: {
            type: 'object',
            oneOf: [{ type: 'string' }, { type: 'number' }],
          },
        },
      },
    };
    const original = structuredClone(schema);

    applyTransformer(schema);

    expect(schema).toEqual(original);
  });

  it('skips variants that already have allOf', () => {
    const schema = {
      components: {
        schemas: {
          VariantWithAllOf: {
            type: 'object',
            allOf: [{ $ref: '#/components/schemas/Base' }],
          },
          Parent: {
            type: 'object',
            properties: {
              shared: { type: 'string' },
            },
            oneOf: [{ $ref: '#/components/schemas/VariantWithAllOf' }],
          },
        },
      },
    };

    applyTransformer(schema);

    expect(schema.components.schemas.VariantWithAllOf.allOf).toHaveLength(1);
    expect(schema.components.schemas.Parent.properties).toEqual({ shared: { type: 'string' } });
  });

  it('handles inline oneOf variants', () => {
    const schema = {
      components: {
        schemas: {
          Parent: {
            type: 'object',
            properties: {
              shared: { type: 'string' },
            },
            required: ['shared'],
            oneOf: [
              { type: 'object', properties: { a: { type: 'string' } } },
              { type: 'object', properties: { b: { type: 'number' } } },
            ],
          },
        },
      },
    };

    applyTransformer(schema);

    expect(schema.components.schemas.Parent.oneOf[0].allOf).toBeDefined();
    expect(schema.components.schemas.Parent.oneOf[0].allOf[0]).toEqual({
      properties: { shared: { type: 'string' } },
      required: ['shared'],
    });
    expect(schema.components.schemas.Parent.properties).toBeUndefined();
  });

  it('normalizes $ref with sibling constraints to allOf', () => {
    const schema = {
      components: {
        schemas: {
          Base: { type: 'string' },
          Variant: {
            type: 'object',
            properties: {
              field: {
                $ref: '#/components/schemas/Base',
                const: 'value',
              },
            },
          },
          Parent: {
            type: 'object',
            properties: {
              shared: { type: 'string' },
            },
            oneOf: [{ $ref: '#/components/schemas/Variant' }],
          },
        },
      },
    };

    applyTransformer(schema);

    const variantFieldType = schema.components.schemas.Variant.allOf[1].properties.field;
    expect(variantFieldType.allOf).toEqual([{ $ref: '#/components/schemas/Base' }, { const: 'value' }]);
  });

  it('restores base schema if no variants were transformed', () => {
    const schema = {
      components: {
        schemas: {
          VariantWithAllOf: {
            allOf: [{ type: 'object' }],
          },
          Parent: {
            type: 'object',
            properties: {
              shared: { type: 'string' },
            },
            oneOf: [{ $ref: '#/components/schemas/VariantWithAllOf' }],
          },
        },
      },
    };

    applyTransformer(schema);

    expect(schema.components.schemas.Parent.properties).toEqual({ shared: { type: 'string' } });
  });

  it('handles empty or missing components gracefully', () => {
    expect(() => applyTransformer({})).not.toThrow();
    expect(() => applyTransformer({ components: {} })).not.toThrow();
    expect(() => applyTransformer({ components: { schemas: {} } })).not.toThrow();
    expect(() => applyTransformer(null)).not.toThrow();
    expect(() => applyTransformer(undefined)).not.toThrow();
  });
});
