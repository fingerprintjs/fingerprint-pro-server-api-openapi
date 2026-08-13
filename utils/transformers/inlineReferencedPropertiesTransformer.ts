import { resolveComponent } from '../resolveComponent.ts';
import type { OpenApiDocument, Transformer } from '../openapi.ts';

function inlineProperties(properties: OpenApiDocument, schemas: OpenApiDocument): void {
  Object.keys(properties).forEach((propName) => {
    const prop = properties[propName];
    if (prop?.$ref) {
      const resolved = resolveComponent(prop.$ref, schemas);
      if (resolved) {
        properties[propName] = structuredClone(resolved);
      }
    }
  });
}

export function inlineReferencedPropertiesTransformer(parentName: string): Transformer {
  return function (apiDefinition: OpenApiDocument): void {
    const schemas = apiDefinition?.components?.schemas;
    if (!schemas) return;

    const target = schemas[parentName];
    if (target?.properties) {
      inlineProperties(target.properties, schemas);
    }
  };
}
