import { walkJson } from '../walkJson.js';
import { replaceAllOf } from '../replaceAllOf.js';

export function resolveAllOfTransformer(apiDefinition) {
  walkJson(apiDefinition, 'allOf', (json) => {
    replaceAllOf(json, apiDefinition.components.schemas);
  });
}
