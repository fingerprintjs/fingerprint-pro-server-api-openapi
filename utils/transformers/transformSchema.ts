import process from 'node:process';
import * as yaml from 'js-yaml';
import { addXReadmeTransformer } from './addXReadmeTransformer.ts';
import { appendExternalSchemaRefTransformer } from './appendExternalSchemaRefTransformer.ts';
import { extractFirstParameterExampleTransformer } from './extractFirstParameterExampleTransformer.ts';
import { extractPathOperationInlineEnumsTransformer } from './extractPathOperationInlineEnumsTransformer.ts';
import { parseYaml } from './parseYaml.ts';
import { removeBigExamplesTransformer } from './removeBigExamplesTransformer.ts';
import { removeEdgeTransformer } from './removeEdgeTransformer.ts';
import { removeWebhookTransformer } from './removeWebhookTransformer.ts';
import { resolveAllOfTransformer } from './resolveAllOfTransformer.ts';
import { resolveExternalValueTransformer } from './resolveExternalValueTransformer.ts';
import { replaceTagsTransformer } from './replaceTagsTransformer.ts';
import { removeFieldTransformer } from './removeFieldTransformer.ts';
import { removeFieldsByPrefixTransformer } from './removeFieldsByPrefixTransformer.ts';
import { resolveRefTransformer } from './resolveRefTransformer.ts';
import { removeUnusedSchemasTransformer } from './removeUnusedSchemasTransformer.ts';
import { liftOneOfSharedPropertiesTransformer } from './liftOneOfSharedPropertiesTransformer.ts';
import { removeFieldByPathTransformer } from './removeFieldByPathTransformer.ts';
import { inlineReferencedPropertiesTransformer } from './inlineReferencedPropertiesTransformer.ts';
import { replaceStartEndQueryParameters } from './replaceStartEndQueryParameters.ts';
import type { OpenApiDocument, Transformer } from '../openapi.ts';

export const commonTransformers: Transformer[] = [
  resolveRefTransformer({ schemaPath: './schemas' }),
  resolveExternalValueTransformer({ examplesPath: './schemas/paths/' }),
  removeFieldTransformer('triggered_by'),
  liftOneOfSharedPropertiesTransformer,
  resolveAllOfTransformer,
];

const defaultTransformers: Transformer[] = [...commonTransformers];

export const v4CommonTransformers: Transformer[] = [
  ...commonTransformers,
  removeFieldsByPrefixTransformer('x-ruleset-'),
];

export const v4Transformers: Transformer[] = [
  ...v4CommonTransformers,
  // This transformer should run last to ensure all unused schemas are found
  removeUnusedSchemasTransformer,
];

export const v4SchemaForSdksCommonTransformers: Transformer[] = [
  ...v4Transformers,
  extractFirstParameterExampleTransformer,
  removeEdgeTransformer,
  extractPathOperationInlineEnumsTransformer,
  replaceTagsTransformer,
  removeFieldTransformer('webhooks'),
  removeFieldTransformer('x-readme'),
  removeFieldTransformer('additionalProperties', false),
  removeBigExamplesTransformer,
];

export const v4SchemaForSdksTransformers: Transformer[] = [
  ...v4SchemaForSdksCommonTransformers,
  // Inline enums previously extracted from BotInfo to avoid breaking changes in the SDKs using this schema
  inlineReferencedPropertiesTransformer('BotInfo'),
  // Remove the added enum attribute for BotInfo.category. This must follow the inline transformer on the previous line.
  removeFieldByPathTransformer(['components', 'schemas', 'BotInfo', 'properties', 'category', 'enum']),
  // This transformer should run last to ensure all unused schemas are found
  removeUnusedSchemasTransformer,
];

export const v4SchemaForSdksNormalizedTransformers: Transformer[] = [
  ...v4SchemaForSdksCommonTransformers,
  // Expand oneOf query parameters, start and end, to avoid breaking changes in the SDKs using this schema
  replaceStartEndQueryParameters(),
  // Inline enums previously extracted from BotInfo to avoid breaking changes in the SDKs using this schema
  inlineReferencedPropertiesTransformer('BotInfo'),
  // Remove the added enum attribute for BotInfo.category. This must follow the inline transformer on the previous line.
  removeFieldByPathTransformer(['components', 'schemas', 'BotInfo', 'properties', 'category', 'enum']),
  // This transformer should run last to ensure all unused schemas are found
  removeUnusedSchemasTransformer,
];

export const readmeApiExplorerTransformers: Transformer[] = [
  ...commonTransformers,
  removeWebhookTransformer,
  addXReadmeTransformer(['./x-readme/events.yaml', './x-readme/visitors.yaml', './x-readme/events-search.yaml']),
];

export const relatedVisitorsApiTransformers: Transformer[] = [
  ...commonTransformers,
  appendExternalSchemaRefTransformer,
];

export const removeExtraDocumentationTransformers: Transformer[] = [
  ...defaultTransformers,
  removeBigExamplesTransformer,
  removeFieldTransformer('x-readme'),
];

export const schemaForSdksTransformers: Transformer[] = [
  ...defaultTransformers,
  replaceTagsTransformer,
  removeFieldTransformer('webhooks'),
  removeFieldTransformer('x-readme'),
  removeFieldTransformer('additionalProperties'),
  removeBigExamplesTransformer,
];

export function transformSchema(content: string | Buffer, transformers: Transformer[] = defaultTransformers): string {
  try {
    const apiDefinition: OpenApiDocument = parseYaml(content);

    transformers.forEach((transformer) => {
      transformer(apiDefinition);
    });

    return yaml.dump(apiDefinition, {
      noRefs: true,
    });
  } catch (error) {
    console.error('Failed to transform schema', error);
    process.exit(1);
  }
}
