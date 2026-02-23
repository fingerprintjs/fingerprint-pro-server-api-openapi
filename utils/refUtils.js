const SCHEMA_REF_PREFIX = '#/components/schemas/';

/**
 * Extracts the schema name from a $ref string.
 * Handles JSON pointer escaping (~1 -> /, ~0 -> ~).
 * @param {string} ref
 * @returns {string | null}
 */
export function getSchemaNameFromRef(ref) {
  if (typeof ref !== 'string' || !ref.startsWith(SCHEMA_REF_PREFIX)) {
    return null;
  }
  return ref.slice(SCHEMA_REF_PREFIX.length).replace(/~1/g, '/').replace(/~0/g, '~');
}

/**
 * Creates a $ref string from a schema name.
 * Handles JSON pointer escaping (~ -> ~0, / -> ~1).
 * @param {string} name
 * @returns {string}
 */
export function createSchemaRef(name) {
  const escaped = name.replace(/~/g, '~0').replace(/\//g, '~1');
  return `${SCHEMA_REF_PREFIX}${escaped}`;
}
