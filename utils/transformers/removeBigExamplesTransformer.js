import { walkJson } from '../walkJson.js';

/**
 * Removes response body examples — the media type `examples` maps found under
 * `responses.<code>.content.<mediaType>` — which balloon in size once the
 * external example files are inlined by `resolveExternalValueTransformer`.
 *
 * Schema-level `examples` (the JSON Schema arrays of literal values that
 * document individual fields) and request body examples are intentionally left
 * untouched.
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
