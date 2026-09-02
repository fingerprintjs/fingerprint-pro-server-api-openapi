import type { OpenApiDocument } from '../openapi.ts';

// Removes the Feedback API endpoint from SDK schema outputs (documented in v4-with-examples only)
export function removeFeedbackTransformer(apiDefinition: OpenApiDocument): void {
  delete apiDefinition.paths['/events/{event_id}/feedback'];
}
