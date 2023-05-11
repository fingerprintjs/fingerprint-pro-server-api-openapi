import yaml from 'js-yaml';
import { resolveExternalValueTransformer } from './resolveExternalValueTransformer.js';
import { resolveAllOfTransformer } from './resolveAllOfTransformer.js';
import { removeWebhookTransformer } from './removeWebhookTransformer.js';

const defaultTransformers = [resolveExternalValueTransformer, resolveAllOfTransformer];
export const readmeApiExplorerTransformers = [...defaultTransformers, removeWebhookTransformer];

export function transformSchema(content, transformers = defaultTransformers) {
  const apiDefinition = yaml.load(content);

  transformers.forEach((transformer) => {
    transformer(apiDefinition);
  });

  return yaml.dump(apiDefinition, {
    noRefs: true,
  });
}
