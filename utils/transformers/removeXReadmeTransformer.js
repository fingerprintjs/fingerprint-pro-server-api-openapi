import { walkJson } from '../walkJson.js';

export function removeXReadmeTransformer(apiDefinition) {
  walkJson(apiDefinition, 'x-readme', (partWithKey) => {
    delete partWithKey['x-readme'];
  });
}
