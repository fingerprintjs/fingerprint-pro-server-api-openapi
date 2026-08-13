import { resolveComponent } from './resolveComponent.ts';
import type { OpenApiDocument, JsonObject } from './openapi.ts';

/**
 * Combines multiple objects/schemas together
 * See spec for an example
 */
export function replaceAllOf(currentComponent: OpenApiDocument, components: OpenApiDocument): void {
  const resolvedItems = currentComponent.allOf.map((item: OpenApiDocument) =>
    item.$ref ? resolveComponent(item.$ref, components) : item
  );
  const isObjectComposition = resolvedItems.some(
    (item: OpenApiDocument) =>
      item && typeof item === 'object' && (item.type === 'object' || item.properties || item.required)
  );

  if (isObjectComposition) {
    const properties: JsonObject = {};
    let required: string[] = [];

    resolvedItems.forEach((item: OpenApiDocument) => {
      if (item.required && item.required.length) {
        required = [...new Set([...required, ...item.required])];
      }
      if (item.properties) {
        Object.keys(item.properties).forEach((propName) => {
          properties[propName] = structuredClone(item.properties[propName]);
        });
      }
    });

    currentComponent.type = 'object';
    currentComponent.properties = properties;
    currentComponent.additionalProperties = false;
    if (required.length > 0) {
      currentComponent.required = required;
    } else {
      delete currentComponent.required;
    }
  } else {
    const mergedComponent: JsonObject = {};
    let enumValues: any[] | undefined;
    let hasConst = false;
    let constValue: any;

    resolvedItems.forEach((item: OpenApiDocument) => {
      if (!item || typeof item !== 'object') {
        return;
      }

      for (const [key, value] of Object.entries(item)) {
        if (key === 'enum' || key === 'const') {
          continue;
        }
        if (!Object.hasOwn(mergedComponent, key)) {
          mergedComponent[key] = structuredClone(value);
        }
      }

      if (Array.isArray(item.enum)) {
        if (!enumValues) {
          enumValues = [...item.enum];
        } else {
          enumValues = enumValues.filter((value) => item.enum.includes(value));
        }
      }

      if (Object.hasOwn(item, 'const')) {
        hasConst = true;
        constValue = item.const;
      }
    });

    if (hasConst) {
      mergedComponent.const = constValue;
    } else if (enumValues) {
      mergedComponent.enum = enumValues;
    }

    Object.keys(currentComponent).forEach((key) => {
      delete currentComponent[key];
    });
    Object.assign(currentComponent, mergedComponent);
  }

  delete currentComponent.allOf;
}
