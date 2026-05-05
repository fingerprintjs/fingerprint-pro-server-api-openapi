import { walkJson } from '../walkJson.js';
import { resolveComponent } from '../resolveComponent.js';

function inlineProperties(properties, schemas) {
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

export function inlineReferencedPropertiesTransformer(parentName) {
  return function (apiDefinition) {
    const schemas = apiDefinition?.components?.schemas;
    if (!schemas) return;

    const target = schemas[parentName];
    if (target?.properties) {
      inlineProperties(target.properties, schemas);
    }
  };
}
