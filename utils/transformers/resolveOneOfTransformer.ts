import { replaceOneOf } from '../replaceOneOf.ts';
import { walkJson } from '../walkJson.ts';
import type { OpenApiDocument } from '../openapi.ts';

/**
 * `oneOf` is used to specify that the object must match *exactly one* of the schemas in the array
 * @see https://swagger.io/docs/specification/data-models/oneof-anyof-allof-not/
 * Resolves oneOf operators by merging all options into a single schema.
 * Properties that are only present in one schema are made optional.
 */
export function resolveOneOfTransformer(apiDefinition: OpenApiDocument) {
  walkJson(apiDefinition, 'oneOf', (json) => {
    replaceOneOf(json, apiDefinition.components.schemas, 'oneOf');
  });
}

/**
 * `anyOf` is used to specify that the object must match *one or more* of the schemas in the array
 * @see https://swagger.io/docs/specification/data-models/oneof-anyof-allof-not/
 * Resolves anyOf operators by merging all options into a single schema.
 * Properties that are only present in one schema are made optional.
 */
export function resolveAnyOfTransformer(apiDefinition: OpenApiDocument) {
  walkJson(apiDefinition, 'anyOf', (json) => {
    replaceOneOf(json, apiDefinition.components.schemas, 'anyOf');
  });
}
