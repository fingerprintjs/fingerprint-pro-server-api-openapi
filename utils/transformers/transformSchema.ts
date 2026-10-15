import process from 'node:process';
import * as yaml from 'js-yaml';
import { addXReadmeTransformer } from './addXReadmeTransformer.ts';
import { appendExternalSchemaRefTransformer } from './appendExternalSchemaRefTransformer.ts';
import { extractFirstParameterExampleTransformer } from './extractFirstParameterExampleTransformer.ts';
import { extractPathOperationInlineEnumsTransformer } from './extractPathOperationInlineEnumsTransformer.ts';
import { flattenNamedSchemaOneOfTransformer } from './flattenNamedSchemaOneOfTransformer.ts';
import { parseYaml } from './parseYaml.ts';
import { removeBigExamplesTransformer } from './removeBigExamplesTransformer.ts';
import { removeDeprecatedResponsesTransformer } from './removeDeprecatedResponsesTransformer.ts';
import { removeEdgeTransformer } from './removeEdgeTransformer.ts';
import { removeFeedbackTransformer } from './removeFeedbackTransformer.ts';
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

const loadTransformers: Transformer[] = [
  resolveRefTransformer({ schemaPath: './schemas' }),
  resolveExternalValueTransformer({ examplesPath: './schemas/paths/' }),
  removeFieldTransformer('triggered_by'),
];

const resolveCompositionTransformers: Transformer[] = [liftOneOfSharedPropertiesTransformer, resolveAllOfTransformer];

export const commonTransformers: Transformer[] = [...loadTransformers, ...resolveCompositionTransformers];

// Flatten `Event` (`EventDevice | EventEdge`) into one object with optional `source`.
// Must run before `oneOf`/`allOf` are rewritten, or `source` is inlined as an enum instead of `$ref: EventSource`.
const flattenEventTransformer = flattenNamedSchemaOneOfTransformer('Event', { optionalProperties: ['source'] });

const v4SdkTransformers: Transformer[] = [
  removeFieldsByPrefixTransformer('x-ruleset-'),
  extractFirstParameterExampleTransformer,
  removeEdgeTransformer,
  removeFeedbackTransformer,
  extractPathOperationInlineEnumsTransformer,
  replaceTagsTransformer,
  removeFieldTransformer('webhooks'),
  removeFieldTransformer('x-readme'),
  removeFieldTransformer('additionalProperties', false),
  removeBigExamplesTransformer,
  // Inline enums previously extracted from BotInfo to avoid breaking changes in the SDKs using this schema
  inlineReferencedPropertiesTransformer('BotInfo'),
  // Remove the added enum attribute for BotInfo.category. This must follow the inline transformer on the previous line.
  removeFieldByPathTransformer(['components', 'schemas', 'BotInfo', 'properties', 'category', 'enum']),
  // This transformer should run last to ensure all unused schemas are found
  removeUnusedSchemasTransformer,
];

export const v4Transformers: Transformer[] = [
  ...loadTransformers,
  ...resolveCompositionTransformers,
  removeFieldsByPrefixTransformer('x-ruleset-'),
  // Hide deprecated responses from the docs. SDK schemas keep them to avoid breaking changes.
  removeDeprecatedResponsesTransformer,
  // This transformer should run last to ensure all unused schemas are found
  removeUnusedSchemasTransformer,
];

// Node SDK: `Event` stays `EventDevice | EventEdge`
export const v4SchemaForSdksTransformers: Transformer[] = [
  ...loadTransformers,
  ...resolveCompositionTransformers,
  ...v4SdkTransformers,
];

// Python, PHP: flat `Event`
export const v4SchemaForSdksFlatTransformers: Transformer[] = [
  ...loadTransformers,
  flattenEventTransformer,
  ...resolveCompositionTransformers,
  ...v4SdkTransformers,
];

// Go, Java, .NET: flat `Event`, then split start/end query parameters
export const v4SchemaForSdksNormalizedTransformers: Transformer[] = [
  ...v4SchemaForSdksFlatTransformers,
  replaceStartEndQueryParameters(),
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
  ...commonTransformers,
  removeBigExamplesTransformer,
  removeFieldTransformer('x-readme'),
];

export const schemaForSdksTransformers: Transformer[] = [
  ...commonTransformers,
  replaceTagsTransformer,
  removeFieldTransformer('webhooks'),
  removeFieldTransformer('x-readme'),
  removeFieldTransformer('additionalProperties'),
  removeBigExamplesTransformer,
];

export function transformSchema(content: string | Buffer, transformers: Transformer[]): string {
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
