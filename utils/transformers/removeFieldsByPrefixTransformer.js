import { walkJsonByPrefix } from '../walkJson.js';

export function removeFieldsByPrefixTransformer(prefix) {
  return function (apiDefinition) {
    walkJsonByPrefix(apiDefinition, prefix, (obj, key) => {
      delete obj[key];
    });
  };
}
