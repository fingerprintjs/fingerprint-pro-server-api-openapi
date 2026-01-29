// @ts-check
import { resolveComponent } from './resolveComponent.js';

/**
 * Merges multiple schemas from oneOf/anyOf into a single schema.
 * Properties that are only present in one schema are made optional.
 * Assumes oneOf/anyOf items describe object schemas.
 * Assumes all $ref entries resolve successfully.
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
  const requiredCounts = {};
  const constValues = {}; // Track const values for each property

  // First pass: collect all properties and track which schemas they appear in
  // Keep the last occurrence of each property
  for (const item of schemas) {
    const currentItem = item.$ref ? resolveComponent(item.$ref, components) : item;
    if (!currentItem) {
      continue;
    }

    const requiredSet = new Set(Array.isArray(currentItem.required) ? currentItem.required : []);

    if (currentItem.properties) {
      for (const propName of Object.keys(currentItem.properties)) {
        propertyCounts[propName] = (propertyCounts[propName] || 0) + 1;
        if (requiredSet.has(propName)) {
          requiredCounts[propName] = (requiredCounts[propName] || 0) + 1;
        }

        // Clone the property to avoid mutating the original schema
        properties[propName] = structuredClone(currentItem.properties[propName]);

        if (!constValues[propName]) {
          constValues[propName] = [];
        }

        // Collect const values if present
        const prop = currentItem.properties[propName];
        if (prop && 'const' in prop) {
          constValues[propName].push(prop.const);
        }
      }
    }
  }

  // Convert properties with multiple const values to enum
  // Only convert if the property appears in multiple schemas AND all have const values
  for (const propName of Object.keys(properties)) {
    const constVals = constValues[propName];
    const count = propertyCounts[propName];
    if (constVals && constVals.length > 1 && count > 1 && constVals.length === count) {
      // All schemas have this property with const values, convert to enum
      const prop = properties[propName];
      delete prop.const;
      prop.enum = [...new Set(constVals)]; // Remove duplicates
      continue;
    }

    // Remove const if it's not present in all schemas
    if (constVals && constVals.length !== count) {
      const prop = properties[propName];
      if (prop && 'const' in prop) {
        delete prop.const;
      }
    }
  }

  // Second pass: determine required fields
  // A property is required only if it appears in ALL schemas and is required in ALL schemas
  const required = [];
  const totalSchemas = schemas.length;

  for (const propName of Object.keys(propertyCounts)) {
    if (propertyCounts[propName] === totalSchemas && requiredCounts[propName] === totalSchemas) {
      required.push(propName);
    }
  }

  // Merge other common properties (type, description, etc.) from the first schema
  const firstSchema = schemas[0]?.$ref ? resolveComponent(schemas[0].$ref, components) : schemas[0];

  currentComponent.type = currentComponent.type || firstSchema.type || 'object';
  // Merge parent properties with oneOf properties (oneOf properties take precedence)
  currentComponent.properties = { ...currentComponent.properties, ...properties };
  currentComponent.additionalProperties = firstSchema.additionalProperties ?? false;

  // Merge parent required with oneOf required
  const parentRequired = Array.isArray(currentComponent.required) ? currentComponent.required : [];
  const mergedRequired = [...new Set([...parentRequired, ...required])];

  if (mergedRequired.length > 0) {
    currentComponent.required = mergedRequired;
  } else {
    // Remove required if empty
    delete currentComponent.required;
  }

  // Remove the oneOf/anyOf operator and discriminator
  delete currentComponent[operator];
  delete currentComponent.discriminator;
}
