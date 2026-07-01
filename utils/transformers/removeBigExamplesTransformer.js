import { walkJson } from '../walkJson.js';

/**
 * Removes response media type examples while preserving schema and request examples.
 */
export function removeBigExamplesTransformer(apiDefinition) {
  walkJson(apiDefinition, 'responses', (partWithResponses) => {
    walkJson(partWithResponses.responses, 'content', (partWithContent) => {
      Object.values(partWithContent.content).forEach((mediaType) => {
        if (mediaType && typeof mediaType === 'object') {
          delete mediaType.examples;
        }
      });
    });
  });
}
