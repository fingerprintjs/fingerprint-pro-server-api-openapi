import type { Transformer } from '../openapi.ts';
import { walkJsonByPath } from '../walkJson.ts';

export function removeFieldByPathTransformer(pathSegments: string[]): Transformer {
  return function (apiDefinition) {
    walkJsonByPath(apiDefinition, pathSegments, (obj, key) => {
      delete obj[key];
    });
  };
}
