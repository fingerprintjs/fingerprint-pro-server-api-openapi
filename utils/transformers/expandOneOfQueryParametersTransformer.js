const VENDOR_EXTENSION_ALIASED_PARAMETER_PROPERTY_NAME = 'x-aliased-parameter-name';

/**
 * Derives a parameter name suffix from a schema option's format or type.
 * @param {Record<string, unknown>} schema
 * @returns {string}
 */
function getSuffix(schema) {
  const format = typeof schema.format === 'string' ? schema.format : null;
  const type = typeof schema.type === 'string' ? schema.type : null;
  const raw = format ?? type ?? 'unknown';
  return raw.replace(/-/g, '_');
}

/**
 * Expands query parameters whose schema uses `oneOf` into one parameter per option.
 * The first option retains the original parameter name; subsequent options are named
 * `<originalName>_<suffix>` where the suffix is derived from the option's format or type.
 * @param {Record<string, unknown>} apiDefinition
 */
export function expandOneOfQueryParametersTransformer(apiDefinition) {
  const paths = apiDefinition?.paths;
  if (!paths || typeof paths !== 'object') {
    return;
  }

  for (const pathItem of Object.values(paths)) {
    if (!pathItem || typeof pathItem !== 'object') {
      continue;
    }

    for (const operation of Object.values(pathItem)) {
      if (!operation || typeof operation !== 'object' || !Array.isArray(operation.parameters)) {
        continue;
      }

      const expanded = [];
      for (const param of operation.parameters) {
        if (param.in !== 'query' || !param.schema || !Array.isArray(param.schema.oneOf)) {
          expanded.push(param);
          continue;
        }

        const { oneOf, ...restSchema } = param.schema;
        const { schema, ...restParam } = param;
        void schema; // schema is unused

        oneOf.forEach((option, index) => {
          const name = index === 0 ? param.name : `${param.name}_${getSuffix(option)}`;
          expanded.push({
            ...restParam,
            name,
            schema: { ...restSchema, ...option },
            // Add a vendor extension to the newly added parameters to indicate they are aliases the first
            // parameter.
            ...(index === 0 ? {} : { [VENDOR_EXTENSION_ALIASED_PARAMETER_PROPERTY_NAME]: param.name }),
          });
        });
      }

      operation.parameters = expanded;
    }
  }
}
