// @ts-check
import { resolveComponent } from './resolveComponent';

/**
 * Merges multiple schemas from oneOf/anyOf into a single schema.
 * Properties that are only present in one schema are made optional.
 * @param {object} currentComponent - The component containing oneOf/anyOf
 * @param {object} components - The components object for resolving $ref
 * @param {string} operator - 'oneOf' or 'anyOf'
 */
export function replaceOneOf(currentComponent, components, operator = 'oneOf') {
  const schemas = currentComponent[operator];
  if (!schemas || !Array.isArray(schemas)) {
    return;
  }

  if (schemas.length === 0) {
    delete currentComponent[operator];
    return;
  }

  const properties = {};
  const propertyCounts = {};
  const allRequired = [];

  // First pass: collect all properties and track which schemas they appear in
  // Keep the first occurrence of each property
  schemas.forEach((item) => {
    const currentItem = item.$ref ? resolveComponent(item.$ref, components) : item;

    if (currentItem.required && Array.isArray(currentItem.required)) {
      allRequired.push(...currentItem.required);
    }

    if (currentItem.properties) {
      Object.keys(currentItem.properties).forEach((propName) => {
        if (!propertyCounts[propName]) {
          propertyCounts[propName] = 0;
          // Keep the first occurrence of the property
          properties[propName] = currentItem.properties[propName];
        }
        propertyCounts[propName]++;
      });
    }
  });

  // Second pass: determine required fields
  // A property is required only if it appears in ALL schemas
  const required = [];
  const totalSchemas = schemas.length;

  Object.keys(propertyCounts).forEach((propName) => {
    if (propertyCounts[propName] === totalSchemas) {
      // Property appears in all schemas, check if it was required in any
      if (allRequired.includes(propName)) {
        required.push(propName);
      }
    }
  });

  // Merge other common properties (type, description, etc.) from the first schema
  const firstSchema = schemas[0]?.$ref ? resolveComponent(schemas[0].$ref, components) : schemas[0];

  currentComponent.type = firstSchema.type || 'object';
  currentComponent.properties = properties;
  currentComponent.additionalProperties = firstSchema.additionalProperties ?? false;

  if (required.length > 0) {
    currentComponent.required = [...new Set(required)];
  } else {
    // Remove required if empty
    delete currentComponent.required;
  }

  // Remove the oneOf/anyOf operator
  delete currentComponent[operator];
}
