import { readFileSync } from 'fs';
import yaml from 'js-yaml';
import { walkJson } from '../walkJson.js';
import path from 'path';

export function loadYaml(path) {
  return yaml.load(readFileSync(path, 'utf8'));
}

class ModelsCache {
  constructor() {
    this.models = {};
    this.refs = {};
  }

  get(modelRef, schemaPath = '.') {
    if (this.refs.hasOwnProperty(modelRef)) {
      return this.refs[modelRef];
    } else {
      const model = loadYaml(schemaPath + '/' + modelRef);
      findAndResolveRefs(model, this, schemaPath + '/' + path.parse(modelRef).dir);
      const modelName = path.parse(modelRef).name;
      // Load paths inline
      if (!model.type && !model.allOf) {
        return model;
      }
      // Load model to the components block
      const ref = `#/components/schemas/${modelName}`;
      this.models[modelRef] = model;
      this.refs[modelRef] = ref;
      return ref;
    }
  }

  serialize() {
    const result = {};
    for (const [key, ref] of Object.entries(this.refs)) {
      const modelName = path.parse(ref).name;
      result[modelName] = this.models[key];
    }
    return result;
  }
}

function findAndResolveRefs(apiDefinition, modelsCache, schemaPath) {
  walkJson(apiDefinition, '$ref', (partWithKey) => {
    // Find ref that use yaml file
    if (/.*\.y(a)?ml.*/.test(partWithKey['$ref'])) {
      const localRef = modelsCache.get(partWithKey['$ref'], schemaPath);
      if (typeof localRef === 'string') {
        // Replace external ref to local ref
        partWithKey['$ref'] = localRef;
      } else {
        // Inline schema
        for (const [key, value] of Object.entries(localRef)) {
          partWithKey[key] = value;
        }
        delete partWithKey['$ref'];
      }
    }
  });
}

export function resolveRefTransformer(options) {
  const schemaPath = options.schemaPath || './';
  return function (apiDefinition) {
    const modelsCache = new ModelsCache(schemaPath);
    // resolve external refs and replace them with inline code or local ref
    findAndResolveRefs(apiDefinition, modelsCache, schemaPath);
    const models = modelsCache.serialize();
    // add local components
    if (Object.keys(models).length > 0) {
      if (!apiDefinition.components) {
        apiDefinition.components = {};
      }
      apiDefinition.components.schemas = { ...(apiDefinition.components.schemas ?? {}), ...models };
    }
  };
}
