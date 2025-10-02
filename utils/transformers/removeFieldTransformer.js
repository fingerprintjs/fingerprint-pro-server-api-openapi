import { walkJson } from '../walkJson.js';

export function removeFieldTransformer(fieldName) {
  return function (apiDefinition) {
    walkJson(apiDefinition, fieldName, (partWithKey) => {
      delete partWithKey[fieldName];
    });
  };
}
