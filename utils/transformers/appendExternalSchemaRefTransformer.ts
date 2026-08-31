import fs from 'fs';
import * as yaml from 'js-yaml';
import { walkJson } from '../walkJson.ts';
import type { OpenApiDocument } from '../openapi.ts';

/**
 * Appends external schema references to the given API definition.
 */
export function appendExternalSchemaRefTransformer(
  apiDefinition: OpenApiDocument,
  schemaDir: string = './schemas'
): void {
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
    const referencedApiDefinition = yaml.load(fs.readFileSync(schemaDir + '/' + filename, 'utf8')) as OpenApiDocument;
    const schema = referencedApiDefinition.components.schemas[schemaName];
    apiDefinition.components = {
      ...apiDefinition.components,
      schemas: { ...apiDefinition?.components?.schemas, [schemaName]: schema },
    };
  });
}
