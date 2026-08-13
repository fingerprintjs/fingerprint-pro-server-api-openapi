import type { Transformer } from '../openapi.ts';
import { walkJsonByPrefix } from '../walkJson.ts';

export function removeFieldsByPrefixTransformer(prefix: string): Transformer {
  return function (apiDefinition) {
    walkJsonByPrefix(apiDefinition, prefix, (obj, key) => {
      delete obj[key];
    });
  };
}
