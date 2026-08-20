const SCHEMA_REF_PREFIX = '#/components/schemas/';

/**
 * Extracts the schema name from a $ref string.
 * Handles JSON pointer escaping (~1 -> /, ~0 -> ~).
 */
export function getSchemaNameFromRef(ref: string): string | null {
  if (typeof ref !== 'string' || !ref.startsWith(SCHEMA_REF_PREFIX)) {
    return null;
  }
  return ref.slice(SCHEMA_REF_PREFIX.length).replace(/~1/g, '/').replace(/~0/g, '~');
}
