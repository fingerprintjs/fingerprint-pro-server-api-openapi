import { walkJson } from '../walkJson.js';
import { replaceAllOf } from '../replaceAllOf.js';

export function resolveAllOfTransformer(apiDefinition) {
  let hasAllOf = true;

  // Re-run until stable because resolving a parent allOf can expose nested allOf entries.
  while (hasAllOf) {
    hasAllOf = false;
    walkJson(apiDefinition, 'allOf', (json) => {
      hasAllOf = true;
      replaceAllOf(json, apiDefinition.components.schemas);
    });
  }
}
