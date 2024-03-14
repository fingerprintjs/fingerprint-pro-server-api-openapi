import { walkJson } from '../walkJson.js';

export function removeBigExamplesTransformer(apiDefinition) {
  walkJson(apiDefinition, 'examples', (partWithKey) => {
    delete partWithKey.examples;
  });
}
