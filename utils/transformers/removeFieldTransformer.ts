import type { Transformer } from '../openapi.ts';
import { walkJson } from '../walkJson.ts';

export function removeFieldTransformer(fieldName: string, withValue?: any): Transformer {
  return function (apiDefinition) {
    walkJson(apiDefinition, fieldName, (partWithKey) => {
      if (withValue === undefined || partWithKey[fieldName] === withValue) {
        delete partWithKey[fieldName];
      }
    });
  };
}
