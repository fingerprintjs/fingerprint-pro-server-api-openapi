import type { OpenApiDocument, Transformer } from '../openapi.ts';

const VENDOR_EXTENSION_PARAMETER_ALIAS_PROPERTY_NAME = 'x-parameter-alias';
const VENDOR_EXTENSION_ALIASED_PARAMETER_PROPERTY_NAME = 'x-aliased-parameter-name';

/**
 * Finds specific query parameters that use the `oneOf` schema construct and replaces the parameter
 * with two parameters. Only query parameters that use two schemas within the `oneOf` construct are
 * supported.
 *
 * The replacement parameters are defined by:
 * - The type of the primary parameter.
 * - An override description for the primary parameter.
 * - A name and description for alias, which uses the other schema from the `oneOf` array.
 */
export function expandOneOfQueryParametersTransformer(replacementParametersMap: OpenApiDocument): Transformer {
  return function (apiDefinition: OpenApiDocument): void {
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

          const replacementParameter = replacementParametersMap[param.name];
          if (!replacementParameter) {
            expanded.push(param);
            continue;
          }

          const { oneOf, ...restSchema } = param.schema;
          const { schema, ...restParam } = param;
          void schema; // schema is unused

          if (oneOf.length !== 2) {
            // Supporting anything other than exactly two oneOf schemas requires more complex handling
            // in the server SDKs so throw an error to prevent that case from breaking code
            // generation downstream
            throw new Error('Unsupported use of oneOf construct in query parameter');
          }

          const primarySchema = oneOf.find((s: OpenApiDocument) => s.type === replacementParameter.primaryType);
          const aliasSchema = oneOf.find((s: OpenApiDocument) => s !== primarySchema);
          if (!primarySchema) {
            throw new Error(
              `No oneOf schema matches primaryType "${replacementParameter.primaryType}" for query parameter "${param.name}"`
            );
          }

          // The primary parameter
          expanded.push({
            ...restParam,
            schema: {
              ...restSchema,
              ...primarySchema,
            },
            description: replacementParameter.overrideDescription,
            [VENDOR_EXTENSION_PARAMETER_ALIAS_PROPERTY_NAME]: replacementParameter.alias.name,
          });

          // The alias parameter
          expanded.push({
            ...restParam,
            name: replacementParameter.alias.name,
            schema: {
              ...restSchema,
              ...aliasSchema,
            },
            description: replacementParameter.alias.description,
            [VENDOR_EXTENSION_ALIASED_PARAMETER_PROPERTY_NAME]: param.name,
          });
        }

        operation.parameters = expanded;
      }
    }
  };
}
