import { resolveComponent } from './resolveComponent.js';

/**
 * Combines multiple objects/schemas together
 * See spec for an example
 */
export function replaceAllOf(currentComponent, components) {
  const properties = {};
  let required = [];
  currentComponent.allOf.forEach((item) => {
    const currentItem = item.$ref ? resolveComponent(item.$ref, components) : item;
    if (currentItem.required && currentItem.required.length) {
      required = [...new Set([...required, ...currentItem.required])];
    }
    if (currentItem.properties) {
      Object.keys(currentItem.properties).forEach((propName) => {
        properties[propName] = currentItem.properties[propName];
      });
    }
  });
  currentComponent.type = 'object';
  currentComponent.properties = properties;
  currentComponent.additionalProperties = false;
  currentComponent.required = required;
  delete currentComponent.allOf;
}
