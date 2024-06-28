import { walkJson } from '../walkJson.js';
import yaml from 'js-yaml';
import fs from 'fs';

/**
 * Appends external schema references to the given API definition.
 *
 * @param {object} apiDefinition - The API definition object.
 * @return {void} This function does not return anything.
 */
export function appendExternalSchemaRefTransformer(apiDefinition) {
  walkJson(apiDefinition, '$ref', (json) => {
    const ref = json.$ref;
    // We only care about references to external schemas
    if (!ref.includes('.yaml')) {
      return;
    }

    // Make ref internal by removing the filename
    const [filename, path] = ref.split('#');
    const schemaName = path.split('/').pop();
    json.$ref = '#' + path;

    // Get the schema from the referenced file and append it to this one
    /** @type {object} */
    const referencedApiDefinition = yaml.load(fs.readFileSync('./schemas/' + filename, 'utf8'));
    const schema = referencedApiDefinition.components.schemas[schemaName];
    apiDefinition.components = {
      ...apiDefinition.components,
      schemas: { ...apiDefinition?.components?.schemas, [schemaName]: schema },
    };
  });
}
