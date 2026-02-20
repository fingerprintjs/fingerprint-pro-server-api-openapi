const BASE_SCHEMA_KEYS = [
  'properties',
  'required',
  'additionalProperties',
  'minProperties',
  'maxProperties',
  'patternProperties',
  'propertyNames',
  'dependentRequired',
  'dependentSchemas',
  'unevaluatedProperties',
];

const VARIANT_SCHEMA_KEYS = ['type', ...BASE_SCHEMA_KEYS];

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

/**
 * @param {Record<string, unknown>} schema
 * @param {string[]} keys
 * @returns {Record<string, unknown>}
 */
function takeKeys(schema, keys) {
  const extracted = {};

  for (const key of keys) {
    if (Object.hasOwn(schema, key)) {
      extracted[key] = schema[key];
      delete schema[key];
    }
  }

  return extracted;
}

/**
 * Convert `{ $ref: ..., ...constraints }` to `allOf` form to keep downstream
 * allOf/oneOf resolvers behavior consistent.
 * @param {unknown} node
 */
function normalizeRefSiblings(node) {
  if (Array.isArray(node)) {
    node.forEach((item) => normalizeRefSiblings(item));
    return;
  }

  if (!isObject(node)) {
    return;
  }

  Object.values(node).forEach((value) => normalizeRefSiblings(value));

  if (Object.hasOwn(node, '$ref') && Object.keys(node).length > 1) {
    const { $ref, ...siblingConstraints } = node;

    Object.keys(node).forEach((key) => {
      delete node[key];
    });

    node.allOf = [{ $ref }, siblingConstraints];
  }
}

/**
 * @param {string} ref
 * @returns {string | null}
 */
function getSchemaNameFromRef(ref) {
  const prefix = '#/components/schemas/';

  if (typeof ref !== 'string' || !ref.startsWith(prefix)) {
    return null;
  }

  return ref.slice(prefix.length).replace(/~1/g, '/').replace(/~0/g, '~');
}

/**
 * @param {Record<string, unknown>} schema
 * @param {Record<string, unknown>} baseSchema
 * @returns {boolean}
 */
function wrapVariantWithBase(schema, baseSchema) {
  if (!isObject(schema) || Object.hasOwn(schema, 'allOf')) {
    return false;
  }

  const variantShape = takeKeys(schema, VARIANT_SCHEMA_KEYS);

  if (Object.keys(variantShape).length === 0) {
    return false;
  }

  normalizeRefSiblings(variantShape);
  schema.allOf = [structuredClone(baseSchema), variantShape];
  return true;
}

/**
 * For schemas that define both shared object properties and `oneOf`, extract
 * the shared object shape and apply it directly to each alternative via `allOf`.
 * @param {Record<string, unknown>} apiDefinition
 */
export function liftOneOfSharedPropertiesTransformer(apiDefinition) {
  const schemas = apiDefinition?.components?.schemas;

  if (!isObject(schemas)) {
    return;
  }

  for (const schema of Object.values(schemas)) {
    if (!isObject(schema) || !Array.isArray(schema.oneOf) || !isObject(schema.properties)) {
      continue;
    }

    const baseSchema = takeKeys(schema, BASE_SCHEMA_KEYS);

    if (Object.keys(baseSchema).length === 0) {
      continue;
    }

    normalizeRefSiblings(baseSchema);

    let transformedCount = 0;

    for (const oneOfAlternative of schema.oneOf) {
      if (!isObject(oneOfAlternative)) {
        continue;
      }

      if (typeof oneOfAlternative.$ref === 'string') {
        const schemaName = getSchemaNameFromRef(oneOfAlternative.$ref);
        const alternativeSchema = schemaName ? schemas[schemaName] : null;

        if (isObject(alternativeSchema) && wrapVariantWithBase(alternativeSchema, baseSchema)) {
          transformedCount += 1;
        }
        continue;
      }

      if (wrapVariantWithBase(oneOfAlternative, baseSchema)) {
        transformedCount += 1;
      }
    }

    if (transformedCount === 0) {
      Object.assign(schema, baseSchema);
    }
  }
}
