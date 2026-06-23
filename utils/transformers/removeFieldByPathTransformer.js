import { walkJsonByPath } from '../walkJson.js';

export function removeFieldByPathTransformer(pathSegments) {
  return function (apiDefinition) {
    walkJsonByPath(apiDefinition, pathSegments, (obj, key) => {
      delete obj[key];
    });
  };
}
