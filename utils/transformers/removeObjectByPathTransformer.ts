import type { JsonObject, Transformer } from '../openapi.ts';
import { walkJsonByPath } from '../walkJson.ts';

export function removeObjectByPathTransformer(
  pathSegments: string[],
  matcher: (obj: JsonObject) => boolean
): Transformer {
  return function (apiDefinition) {
    walkJsonByPath(apiDefinition, pathSegments, (obj, key) => {
      if (matcher(obj[key])) {
        if (Array.isArray(obj)) {
          obj.splice(Number(key), 1);
        } else {
          delete obj[key];
        }
      }
    });
  };
}
