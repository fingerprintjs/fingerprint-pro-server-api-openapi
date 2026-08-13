import type { OpenApiDocument } from '../openapi.ts';
import { walkJson } from '../walkJson.ts';

/**
 * Removes request and response body examples — the media type `examples` maps
 * found under `requestBody` and `responses` — while preserving schema-level
 * `examples` arrays that document individual fields.
 */
export function removeBigExamplesTransformer(apiDefinition: OpenApiDocument): void {
  ['requestBody', 'responses'].forEach((bodyKey) => {
    walkJson(apiDefinition, bodyKey, (partWithBody) => {
      walkJson(partWithBody[bodyKey], 'content', (partWithContent) => {
        (Object.values(partWithContent.content) as OpenApiDocument[]).forEach((mediaType) => {
          if (mediaType && typeof mediaType === 'object') {
            delete mediaType.examples;
          }
        });
      });
    });
  });
}
