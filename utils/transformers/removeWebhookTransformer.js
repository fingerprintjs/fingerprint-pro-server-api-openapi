// Removes the fake webhook endpoint from the API definition to prevent Readme API explorer from showing it
export function removeWebhookTransformer(apiDefinition) {
  delete apiDefinition.paths['/webhook']
}
