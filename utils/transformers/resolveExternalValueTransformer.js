import fs from 'fs';
import { walkJson } from '../walkJson.js';

export function loadJson(path, examplesPath) {
  return JSON.parse(fs.readFileSync(examplesPath + '/' + path));
}

export function resolveExternalValueTransformer(options) {
  const examplesPath = options.examplesPath || './';
  return function (apiDefinition) {
    walkJson(apiDefinition, 'externalValue', (partWithKey) => {
      partWithKey.value = loadJson(partWithKey.externalValue, examplesPath);
      delete partWithKey.externalValue;
    });
  };
}
