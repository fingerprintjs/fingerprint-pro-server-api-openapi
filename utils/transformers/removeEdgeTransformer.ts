import type { OpenApiDocument } from '../openapi.ts';

// Removes the Edge API endpoint from SDK schema outputs (documented in v4-with-examples only)
export function removeEdgeTransformer(apiDefinition: OpenApiDocument): void {
  delete apiDefinition.paths['/edge'];
}
