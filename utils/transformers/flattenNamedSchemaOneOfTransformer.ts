import { replaceOneOf } from '../replaceOneOf.ts';
import type { Transformer } from '../openapi.ts';

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export type FlattenNamedSchemaOneOfOptions = {
  /**
   * Leave these properties optional on the flattened object even if every
   * variant required them. Used so Event.source stays optional in SDK schemas.
   */
  optionalProperties?: string[];
};

/**
 * Flatten `oneOf` on a named schema only. Used so EventDevice | EventEdge
 * becomes a single Event in SDK output without flattening EventRuleAction
 * and other unions.
 */
export function flattenNamedSchemaOneOfTransformer(
  schemaName: string,
  options: FlattenNamedSchemaOneOfOptions = {}
): Transformer {
  return (apiDefinition) => {
    const schema = apiDefinition.components?.schemas?.[schemaName];
    if (!schema?.oneOf) {
      return;
    }
    replaceOneOf(schema, apiDefinition.components.schemas, 'oneOf');

    // replaceOneOf may attach `enum` next to a `$ref` (e.g. Event.source).
    // Generators then emit a nested SourceEnum and change getSource()'s type.
    if (isObject(schema.properties)) {
      for (const property of Object.values(schema.properties)) {
        if (isObject(property) && typeof property.$ref === 'string') {
          delete property.enum;
          delete property.const;
        }
      }
    }

    const optionalProperties = options.optionalProperties;
    if (!optionalProperties?.length || !Array.isArray(schema.required)) {
      return;
    }

    schema.required = schema.required.filter((name: string) => !optionalProperties.includes(name));
    if (schema.required.length === 0) {
      delete schema.required;
    }
  };
}
