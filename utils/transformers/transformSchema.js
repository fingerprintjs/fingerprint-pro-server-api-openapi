import yaml from 'js-yaml';
import { resolveExternalValueTransformer } from './resolveExternalValueTransformer.js';
import { resolveAllOfRecursivelyTransformer, resolveAllOfTransformer } from './resolveAllOfTransformer.js';
import { resolveOneOfTransformer, resolveAnyOfTransformer } from './resolveOneOfTransformer.js';
import { removeWebhookTransformer } from './removeWebhookTransformer.js';
import { replaceTagsTransformer } from './replaceTagsTransformer.js';
import { removeBigExamplesTransformer } from './removeBigExamplesTransformer.js';
import { removeFieldTransformer } from './removeFieldTransformer.js';
import { removeFieldsByPrefixTransformer } from './removeFieldsByPrefixTransformer.js';
import { appendExternalSchemaRefTransformer } from './appendExternalSchemaRefTransformer.js';
import { resolveRefTransformer } from './resolveRefTransformer.js';
import { addXReadmeTransformer } from './addXReadmeTransformer.js';
import { extractPathOperationInlineEnumsTransformer } from './extractPathOperationInlineEnumsTransformer.js';
import { parseYaml } from './parseYaml.js';
import { removeUnusedSchemasTransformer } from './removeUnusedSchemasTransformer.js';
import { liftOneOfSharedPropertiesTransformer } from './liftOneOfSharedPropertiesTransformer.js';

export const commonTransformers = [
  resolveRefTransformer({ schemaPath: './schemas' }),
  resolveExternalValueTransformer({ examplesPath: './schemas/paths/' }),
  removeFieldTransformer('triggered_by'),
  liftOneOfSharedPropertiesTransformer,
  resolveAllOfTransformer,
];

const defaultTransformers = [...commonTransformers];

export const v4CommonTransformers = [...commonTransformers, removeFieldsByPrefixTransformer('x-ruleset-')];

export const v4Transformers = [
  ...v4CommonTransformers,
  // This transformer should run last to ensure all unused schemas are found
  removeUnusedSchemasTransformer,
];

export const v4SchemaForSdksCommonTransformers = [
  ...v4Transformers,
  extractPathOperationInlineEnumsTransformer,
  replaceTagsTransformer,
  removeFieldTransformer('webhooks'),
  removeFieldTransformer('x-readme'),
  removeFieldTransformer('additionalProperties', false),
  removeBigExamplesTransformer,
];

export const v4SchemaForSdksTransformers = [
  ...v4SchemaForSdksCommonTransformers,
  // This transformer should run last to ensure all unused schemas are found
  removeUnusedSchemasTransformer,
];

export const v4SchemaForSdksNormalizedTransformers = [
  ...v4SchemaForSdksCommonTransformers,
  resolveAllOfRecursivelyTransformer,
  resolveOneOfTransformer,
  resolveAnyOfTransformer,
  // do this at the end of the pipeline again to make sure previous transformers didn't introduce it again
  removeFieldTransformer('additionalProperties', false),
  // This transformer should run last to ensure all unused schemas are found
  removeUnusedSchemasTransformer,
];

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
  replaceTagsTransformer,
  removeFieldTransformer('webhooks'),
  removeFieldTransformer('x-readme'),
  removeFieldTransformer('additionalProperties'),
  removeBigExamplesTransformer,
];

export function transformSchema(content, transformers = defaultTransformers) {
  const apiDefinition = parseYaml(content);

  transformers.forEach((transformer) => {
    transformer(apiDefinition);
  });

  return yaml.dump(apiDefinition, {
    noRefs: true,
  });
}
