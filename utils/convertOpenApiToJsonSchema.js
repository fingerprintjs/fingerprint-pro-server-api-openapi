import { walkJson } from './walkJson.js';
import { replaceAllOf } from './replaceAllOf.js';

export function convertOpenApiToJsonSchema(apiDefinition, schemaRef) {
  return {
    type: 'object',
    $schema: 'http://json-schema.org/draft-04/schema#',
    $ref: schemaRef,
    definitions: componentsToDefenitions(apiDefinition.components.schemas),
  };
}

function componentsToDefenitions(components) {
  // Move schemas from components/schemas to definitions path
  walkJson(components, '$ref', (json) => {
    json.$ref = json.$ref.replace('components/schemas', 'definitions');
  });
  // Remove examples
  walkJson(components, 'example', (json) => {
    delete json.example;
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
