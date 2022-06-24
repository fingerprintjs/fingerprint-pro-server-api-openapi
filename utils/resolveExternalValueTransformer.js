import fs from 'fs';
import yaml from 'js-yaml';
import { walkJson } from './walkJson.js';

export function loadJson(path) {
  return JSON.parse(fs.readFileSync('.' + path));
}

export function resolveExternalValueTransformer(content) {
  const apiDefinition = yaml.load(content);
  walkJson(apiDefinition, 'externalValue', (partWithKey) => {
    partWithKey.value = loadJson(partWithKey.externalValue);
    delete partWithKey.externalValue;
  });
  return yaml.dump(apiDefinition);
}
