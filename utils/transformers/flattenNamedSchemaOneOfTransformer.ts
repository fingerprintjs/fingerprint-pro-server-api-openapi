import { replaceOneOf } from '../replaceOneOf.ts';
import type { Transformer } from '../openapi.ts';

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function collapseToEnumRef(property: Record<string, unknown>): void {
  if (typeof property.$ref === 'string') {
    delete property.enum;
    delete property.const;
    return;
  }

  if (!Array.isArray(property.allOf)) {
    return;
  }

  const refItem = property.allOf.find((item) => isObject(item) && typeof item.$ref === 'string');
  if (!isObject(refItem) || typeof refItem.$ref !== 'string') {
    return;
  }

  let platforms = property['x-platforms'];
  for (const item of property.allOf) {
    if (isObject(item) && item['x-platforms'] !== undefined) {
      platforms = item['x-platforms'];
    }
  }
  for (const key of Object.keys(property)) {
    delete property[key];
  }
  property.$ref = refItem.$ref;
  if (platforms !== undefined) {
    property['x-platforms'] = platforms;
  }
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

    // Discriminator fields use `allOf: [$ref Enum, const]` (EventRuleAction) or
    // `$ref` + sibling `const`. Flattening would otherwise leave a nested
    // SourceEnum / leftover const and change getSource()'s type.
    if (isObject(schema.properties)) {
      for (const property of Object.values(schema.properties)) {
        if (isObject(property)) {
          collapseToEnumRef(property);
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
