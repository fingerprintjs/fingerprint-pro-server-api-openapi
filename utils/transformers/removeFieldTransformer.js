import { walkJson } from '../walkJson.js';

export function removeFieldTransformer(fieldName, expectedValue) {
  return function (apiDefinition) {
    walkJson(apiDefinition, fieldName, (partWithKey) => {
      if (expectedValue === undefined || partWithKey[fieldName] === expectedValue) {
        delete partWithKey[fieldName];
      }
    });
  };
}
