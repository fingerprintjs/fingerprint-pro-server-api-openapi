import yaml from 'js-yaml';
import { resolveExternalValueTransformer } from './resolveExternalValueTransformer.js';
import { resolveAllOfTransformer } from './resolveAllOfTransformer.js';
import { removeWebhookTransformer } from './removeWebhookTransformer.js';
import { replaceTagsTransformer } from './replaceTagsTransformer.js';
import { removeBigExamplesTransformer } from './removeBigExamplesTransformer.js';
import { removeFieldTransformer } from './removeFieldTransformer.js';
import { appendExternalSchemaRefTransformer } from './appendExternalSchemaRefTransformer.js';
import { resolveRefTransformer } from './resolveRefTransformer.js';
import { addXReadmeTransformer } from './addXReadmeTransformer.js';

export const commonTransformers = [
  resolveRefTransformer({ schemaPath: './schemas' }),
  resolveExternalValueTransformer({ examplesPath: './schemas/paths/' }),
  removeFieldTransformer('triggered_by'),
  resolveAllOfTransformer,
];

const defaultTransformers = [...commonTransformers, replaceTagsTransformer];

export const readmeApiExplorerTransformers = [
  ...commonTransformers,
  removeWebhookTransformer,
  addXReadmeTransformer(['./x-readme/events.yaml', './x-readme/visitors.yaml', './x-readme/events-search.yaml']),
];

export const relatedVisitorsApiTransformers = [...commonTransformers, appendExternalSchemaRefTransformer];

export const removeExtraDocumentationTransformers = [
  ...defaultTransformers,
  removeBigExamplesTransformer,
  removeFieldTransformer('x-readme'),
];

export const schemaForSdksTransformers = [
  ...defaultTransformers,
  removeFieldTransformer('x-readme'),
  removeBigExamplesTransformer,
];

export function transformSchema(content, transformers = defaultTransformers) {
  const apiDefinition = yaml.load(content);

  transformers.forEach((transformer) => {
    transformer(apiDefinition);
  });

  return yaml.dump(apiDefinition, {
    noRefs: true,
  });
}
