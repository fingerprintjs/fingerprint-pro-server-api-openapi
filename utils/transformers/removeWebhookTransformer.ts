import type { OpenApiDocument } from '../openapi.ts';

// Removes the fake webhook endpoint from the API definition to prevent Readme API explorer from showing it
export function removeWebhookTransformer(apiDefinition: OpenApiDocument): void {
  delete apiDefinition.paths['/webhook'];
}
