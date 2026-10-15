import { replaceOneOf } from '../replaceOneOf.ts';
import type { Transformer } from '../openapi.ts';

export type FlattenNamedSchemaOneOfOptions = {
  /**
   * Leave these properties optional on the flattened object even if every
   * variant requires them. Keeps `Event.source` optional in SDK schemas.
   */
  optionalProperties?: string[];
  /**
   * Replaces the union's description, which usually describes the variants and doesn't fit a flat object.
   */
  description?: string;
};

/**
 * Flatten `oneOf` on one named schema, leaving other unions (e.g. `EventRuleAction`) intact.
 * Turns `Event` (`EventDevice | EventEdge`) back into a single object for SDKs that can't model the union.
 *
 * Run it before `liftOneOfSharedPropertiesTransformer` and `resolveAllOfTransformer`. Variants define the
 * discriminator as `$ref` + sibling `const`; those transformers would inline it into `type: string, enum`.
 */
export function flattenNamedSchemaOneOfTransformer(
  schemaName: string,
  { optionalProperties = [], description }: FlattenNamedSchemaOneOfOptions = {}
): Transformer {
  return (apiDefinition) => {
    const schemas = apiDefinition.components?.schemas;
    const schema = schemas?.[schemaName];
    if (!schema?.oneOf) {
      return;
    }

    replaceOneOf(schema, schemas, 'oneOf');

    if (description !== undefined) {
      schema.description = description;
    }

    // replaceOneOf merges the variants' `const`s into an `enum` next to the `$ref`. Keep the plain `$ref`.
    for (const property of Object.values<Record<string, unknown>>(schema.properties ?? {})) {
      if (typeof property.$ref === 'string') {
        delete property.enum;
        delete property.const;
      }
    }

    if (Array.isArray(schema.required)) {
      schema.required = schema.required.filter((name: string) => !optionalProperties.includes(name));
      if (schema.required.length === 0) {
        delete schema.required;
      }
    }
  };
}
