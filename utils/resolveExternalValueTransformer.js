import fs from 'fs';
import yaml from 'js-yaml';

export function loadJson(path) {
  return JSON.parse(fs.readFileSync('.' + path));
}

function walk(json, key, callback) {
  Object.keys(json).forEach((iteratorKey) => {
    if (iteratorKey === key) {
      callback(json);
    } else if (json[iteratorKey] && typeof json[iteratorKey] === 'object') {
      walk(json[iteratorKey], key, callback);
    }
  });
}

export function resolveExternalValueTransformer(content) {
  const apiDefinition = yaml.load(content);
  walk(apiDefinition, 'externalValue', (partWithKey) => {
    partWithKey.value = loadJson(partWithKey.externalValue);
    delete partWithKey.externalValue;
  });
  return yaml.dump(apiDefinition);
}
