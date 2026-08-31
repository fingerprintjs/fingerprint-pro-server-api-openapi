import { readFileSync } from 'fs';
import * as yaml from 'js-yaml';
import type { OpenApiDocument, Transformer } from '../openapi.ts';

function loadYaml(path: string): OpenApiDocument {
  return yaml.load(readFileSync(path, 'utf8')) as OpenApiDocument;
}

function prepareXReadmeDB(xReadmeSources: string[]): Set<OpenApiDocument> {
  const xReadme = new Set<OpenApiDocument>();
  for (const xReadmeSource of xReadmeSources) {
    xReadme.add(loadYaml(xReadmeSource));
  }
  return xReadme;
}

/**
 * Adds x-readme to the given API definition according to xReadmeSources.
 * xReadmeSources is a list of paths to x-readme yaml files.
 */
export function addXReadmeTransformer(xReadmeSources: string[]): Transformer {
  const xReadmeDB = prepareXReadmeDB(xReadmeSources);
  return function (apiDefinition: OpenApiDocument): void {
    const schemaPaths = apiDefinition.paths;
    for (const xReadmeRecord of xReadmeDB) {
      for (const [path, methods] of Object.entries<OpenApiDocument>(xReadmeRecord)) {
        if (schemaPaths.hasOwnProperty(path)) {
          for (const [method, data] of Object.entries<OpenApiDocument>(methods)) {
            if (schemaPaths[path].hasOwnProperty(method)) {
              schemaPaths[path][method]['x-readme'] = data['x-readme'];
            }
          }
        }
      }
    }
  };
}
