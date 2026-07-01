import { walkJson } from '../walkJson.js';

/**
 * Removes request and response body examples — the media type `examples` maps
 * found under `requestBody` and `responses` — while preserving schema-level
 * `examples` arrays that document individual fields.
 */
export function removeBigExamplesTransformer(apiDefinition) {
  ['requestBody', 'responses'].forEach((bodyKey) => {
    walkJson(apiDefinition, bodyKey, (partWithBody) => {
      walkJson(partWithBody[bodyKey], 'content', (partWithContent) => {
        Object.values(partWithContent.content).forEach((mediaType) => {
          if (mediaType && typeof mediaType === 'object') {
            delete mediaType.examples;
          }
        });
      });
    });
  });
}
