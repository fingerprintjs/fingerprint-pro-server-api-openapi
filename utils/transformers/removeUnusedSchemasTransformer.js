/**
 * Transformer that removes schemas from `/components/schemas` if they are not referenced elsewhere in the schema.
 */

import { walkJson } from '../walkJson.js';

const SCHEMA_REF_PREFIX = '#/components/schemas/';
const MAX_REFERENCE_DEPTH = 10;

function extractSchemaName(ref) {
  if (typeof ref === 'string' && ref.startsWith(SCHEMA_REF_PREFIX)) {
    return ref.slice(SCHEMA_REF_PREFIX.length);
  }
  return null;
}

function removeUnreferencedSchemas(apiDefinition, schemas) {
  const referencedSchemas = new Set();

  walkJson(apiDefinition, '$ref', (node) => {
    const name = extractSchemaName(node.$ref);
    if (name) {
      referencedSchemas.add(name);
    }
  });

  walkJson(apiDefinition, 'discriminator', (node) => {
    const mapping = node.discriminator?.mapping;
    if (mapping) {
      for (const ref of Object.values(mapping)) {
        const name = extractSchemaName(ref);
        if (name) {
          referencedSchemas.add(name);
        }
      }
    }
  });

  // Remove schemas not in the referenced set
  for (const schemaName of Object.keys(schemas)) {
    if (!referencedSchemas.has(schemaName)) {
      delete schemas[schemaName];
    }
  }
}

/**
 * Removes schemas from /components/schemas that are not referenced elsewhere
 */
export function removeUnusedSchemasTransformer(apiDefinition) {
  const {
    components: { schemas },
  } = apiDefinition;

  // Remove unused schemas in multiple passes. Each pass may create new
  // unused schemas because a schema's referrers may themselves have been
  // unused.
  for (let i = 0; i < MAX_REFERENCE_DEPTH; i++) {
    const beforeSchemaCount = Object.keys(schemas).length;
    removeUnreferencedSchemas(apiDefinition, schemas);
    const afterSchemaCount = Object.keys(schemas).length;
    if (beforeSchemaCount === afterSchemaCount) {
      // No changes, the process is complete
      return;
    }
  }

  throw new Error(`Some unused schemas were referenced in a chain more than ${MAX_REFERENCE_DEPTH} deep`);
}
