import { replaceAllOf } from '../replaceAllOf.ts';
import { walkJson } from '../walkJson.ts';
import type { OpenApiDocument } from '../openapi.ts';

export function resolveAllOfTransformer(apiDefinition: OpenApiDocument): void {
  walkJson(apiDefinition, 'allOf', (json) => {
    replaceAllOf(json, apiDefinition.components.schemas);
  });
}

export function resolveAllOfRecursivelyTransformer(apiDefinition: OpenApiDocument): void {
  let hasAllOf = true;

  // Re-run until stable because resolving a parent allOf can expose nested allOf entries.
  while (hasAllOf) {
    hasAllOf = false;
    walkJson(apiDefinition, 'allOf', (json) => {
      hasAllOf = true;
      replaceAllOf(json, apiDefinition.components.schemas);
    });
  }
}
