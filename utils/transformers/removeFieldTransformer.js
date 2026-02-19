import { walkJson } from '../walkJson.js';

export function removeFieldTransformer(fieldName, withValue) {
  return function (apiDefinition) {
    walkJson(apiDefinition, fieldName, (partWithKey) => {
      if (withValue === undefined || partWithKey[fieldName] === withValue) {
        delete partWithKey[fieldName];
      }
    });
  };
}
