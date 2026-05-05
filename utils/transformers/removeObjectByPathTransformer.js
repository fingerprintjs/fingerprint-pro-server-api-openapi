import { walkJsonByPath } from '../walkJson.js';

export function removeObjectByPathTransformer(pathSegments, matcher) {
  return function (apiDefinition) {
    walkJsonByPath(apiDefinition, pathSegments, (obj, key) => {
      if (matcher(obj[key])) {
        if (Array.isArray(obj)) {
          obj.splice(key, 1);
        } else {
          delete obj[key];
        }
      }
    });
  };
}
