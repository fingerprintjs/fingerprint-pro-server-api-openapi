import { walkJson } from './walkJson.js';
import { replaceAllOf } from './replaceAllOf.js';

/**
 *
 * @param {Object} apiDefinition
 * @param {string} schemaRef
 * @returns
 */
export function convertOpenApiToJsonSchema(apiDefinition, schemaRef) {
  return {
    type: 'object',
    $schema: 'http://json-schema.org/draft-04/schema#',
    $ref: schemaRef,
    definitions: componentsToDefenitions(apiDefinition.components.schemas),
  };
}

/**
 *
 * @param {Object} components
 * @returns
 */
function componentsToDefenitions(components) {
  // Move schemas from components/schemas to definitions path
  walkJson(components, '$ref', (json) => {
    json.$ref = json.$ref.replace('components/schemas', 'definitions');
  });
  // Remove examples
  walkJson(components, 'example', (json) => {
    delete json.example;
  });
  // Drop empty `required: []` arrays — they are a no-op for validation but
  // violate the draft-04 meta-schema (`required` must have at least 1 item).
  walkJson(components, 'required', (json) => {
    if (Array.isArray(json.required) && json.required.length === 0) {
      delete json.required;
    }
  });
  // Convert {schema: {$ref: '#/definitions/someRef'}} to  {$ref: '#/definitions/someRef'}
  walkJson(components, 'schema', (json) => {
    json.$ref = json.schema.$ref;
    delete json.schema;
  });

  walkJson(components, 'allOf', (json) => {
    replaceAllOf(json, components);
  });
  return components;
}
