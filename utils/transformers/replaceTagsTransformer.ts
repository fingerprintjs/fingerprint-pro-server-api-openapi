import { walkJson } from '../walkJson.ts';
import type { OpenApiDocument } from '../openapi.ts';

// Removes tags used by the Readme.com API explorer
// and applies a single "Fingerprint" tag to all paths, to be consumed by SDK generators.
export function replaceTagsTransformer(apiDefinition: OpenApiDocument): void {
  apiDefinition.tags = [
    {
      name: 'Fingerprint',
      description:
        'Using the Server API you can retrieve information about individual analysis events or event history of individual visitors.',
      externalDocs: {
        description: 'API documentation',
        url: 'https://docs.fingerprint.com/reference/server-api',
      },
    },
  ];
  walkJson(apiDefinition.paths, 'tags', (json) => {
    json.tags = ['Fingerprint'];
  });
}
