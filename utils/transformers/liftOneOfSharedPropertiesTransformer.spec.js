import { transformSchema } from './transformSchema.js';
import { parseYaml } from './parseYaml.js';
import { liftOneOfSharedPropertiesTransformer } from './liftOneOfSharedPropertiesTransformer.js';

const applyTransformer = (yaml) => parseYaml(transformSchema(yaml, [liftOneOfSharedPropertiesTransformer]));

describe('Test liftOneOfSharedPropertiesTransformer', () => {
  it('extracts oneOf sibling properties into a shared base and injects it into variants using allOf', () => {
    const input = `openapi: 3.1.1
components:
  schemas:
    Kind:
      type: string
      enum:
        - allow
        - block
    ActionAllow:
      description: allow action
      type: object
      required:
        - type
      properties:
        type:
          $ref: '#/components/schemas/Kind'
          const: allow
        allow_only:
          type: string
    ActionBlock:
      description: block action
      type: object
      required:
        - type
      properties:
        type:
          $ref: '#/components/schemas/Kind'
          const: block
        block_only:
          type: string
    Action:
      type: object
      description: action union
      required:
        - shared
      properties:
        shared:
          type: string
      oneOf:
        - $ref: '#/components/schemas/ActionAllow'
        - $ref: '#/components/schemas/ActionBlock'
      discriminator:
        propertyName: type
`;

    const parsed = applyTransformer(input);
    const { Action, ActionAllow, ActionBlock } = parsed.components.schemas;

    expect(Action.description).toBe('action union');
    expect(Action.type).toBe('object');
    expect(Action.properties).toBeUndefined();
    expect(Action.required).toBeUndefined();

    for (const variant of [ActionAllow, ActionBlock]) {
      expect(variant.description).toBeDefined();
      expect(variant.allOf).toHaveLength(2);
      expect(variant.allOf[0]).toEqual({
        properties: {
          shared: {
            type: 'string',
          },
        },
        required: ['shared'],
      });
      expect(variant.allOf[1].type).toBe('object');
      expect(variant.allOf[1].properties.type).toHaveProperty('allOf');
    }
  });
});
