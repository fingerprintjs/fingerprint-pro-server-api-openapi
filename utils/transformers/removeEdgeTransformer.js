// Removes the Edge API endpoint from SDK schema outputs (documented in v4-with-examples only)
export function removeEdgeTransformer(apiDefinition) {
  delete apiDefinition.paths['/edge'];
}
