export function removeWebhookTransformer(apiDefinition) {
  delete apiDefinition.paths['/webhook'];
}
