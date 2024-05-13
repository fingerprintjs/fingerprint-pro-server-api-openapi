// Removes the fake webhook endpoint from the API definition to prevent Readme API explorer from showing it
export function removeDeleteVisitorTransformer(apiDefinition) {
  delete apiDefinition.paths['/visitors/{visitor_id}'].delete;
}
