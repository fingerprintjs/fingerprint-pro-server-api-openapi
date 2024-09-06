import yaml from 'js-yaml';
import { readFileSync } from 'fs';

function loadYaml(path) {
  return yaml.load(readFileSync(path, 'utf8'));
}

/**
 *
 * @param {string[]} xReadmeSources
 * @returns {Set<object>}
 */
function prepareXReadmeDB(xReadmeSources) {
  const xReadme = new Set();
  for (const xReadmeSource of xReadmeSources) {
    xReadme.add(loadYaml(xReadmeSource));
  }
  return xReadme;
}

/**
 * Adds x-readme to the given API definition according to xReadmeSources
 * @param {string[]} xReadmeSources List of paths to x-readme yaml files
 * @returns {(function(*): void)}
 */
export function addXReadmeTransformer(xReadmeSources) {
  const xReadmeDB = prepareXReadmeDB(xReadmeSources);
  return function (apiDefinition) {
    const schemaPaths = apiDefinition.paths;
    for (const xReadmeRecord of xReadmeDB) {
      for (const [path, methods] of Object.entries(xReadmeRecord)) {
        if (schemaPaths.hasOwnProperty(path)) {
          for (const [method, data] of Object.entries(methods)) {
            if (schemaPaths[path].hasOwnProperty(method)) {
              schemaPaths[path][method]['x-readme'] = data['x-readme'];
            }
          }
        }
      }
    }
  };
}
