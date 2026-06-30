import { walkJson } from '../walkJson.js';

/**
 * Extract the first example from the `examples` array, if present, for
 * all parameters of operations.
 *
 * Despite `example` being deprecated in OAS 3.1 and later, the code
 * generators are still relying on it so this transformer allows a
 * schema to continue using `example` while migrating to `examples`
 * in the main schema.
 *
 * @param {Record<string, any>} apiDefinition
 */
export function extractFirstParameterExampleTransformer(apiDefinition) {
  if (apiDefinition.paths) {
    walkJson(apiDefinition.paths, 'examples', (partWithKey) => {
      if (Array.isArray(partWithKey.examples)) {
        const firstExample = partWithKey.examples[0];
        if (firstExample !== undefined) {
          partWithKey.example = firstExample;
        }
      }
    });
  }
}
