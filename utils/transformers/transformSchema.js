import yaml from 'js-yaml';
import { resolveExternalValueTransformer } from './resolveExternalValueTransformer.js';
import { resolveAllOfTransformer } from './resolveAllOfTransformer.js';

const defaultTransformers = [resolveExternalValueTransformer, resolveAllOfTransformer];

export function transformSchema(content, transformers = defaultTransformers) {
  const apiDefinition = yaml.load(content);

  transformers.forEach((transformer) => {
    transformer(apiDefinition);
  });

  return yaml.dump(apiDefinition, {
    noRefs: true,
  });
}
