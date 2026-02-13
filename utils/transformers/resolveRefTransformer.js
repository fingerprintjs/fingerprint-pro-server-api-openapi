import { readFileSync } from 'fs';
import yaml from 'js-yaml';
import { walkJson } from '../walkJson.js';
import path from 'path';

/**
 * Load and parse yaml file
 * @param {string} path
 * @returns {object}
 */
function loadYaml(path) {
  return yaml.load(readFileSync(path, 'utf8'));
}

class ModelsCache {
  constructor() {
    this.models = {};
    this.refs = {};
  }

  /**
   * Get model by $ref
   * @param {string} modelRef
   * @param {string} schemaPath
   * @returns {string}
   */
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

/**
 * Resolves external refs
 * For components replace ref to local and adds component to ModelsCache
 * For other external refs just inline code
 * @param {string} apiDefinition
 * @param {ModelsCache} modelsCache
 * @param {string} schemaPath
 */
function findAndResolveRefs(apiDefinition, modelsCache, schemaPath) {
  const resolveRef = (parent, refProperty) => {
    // Find ref that use yaml file
    if (/.*\.y(a)?ml.*/.test(parent[refProperty])) {
      const localRef = modelsCache.get(parent[refProperty], schemaPath);
      if (typeof localRef === 'string') {
        // Replace external ref to local ref
        parent[refProperty] = localRef;
      } else {
        // Inline schema
        for (const [key, value] of Object.entries(localRef)) {
          parent[key] = value;
        }
        delete parent[refProperty];
      }
    }
  };

  walkJson(apiDefinition, '$ref', (partWithKey) => {
    resolveRef(partWithKey, '$ref');
  });

  walkJson(apiDefinition, 'discriminator', (partWithKey) => {
    const mapping = partWithKey['discriminator']?.['mapping'];
    if (mapping) {
      Object.keys(mapping).forEach((key) => {
        resolveRef(mapping, key);
      });
    }
  });
}

/**
 * Resolves external references in an API definition and replaces them with inline code or local references.
 * @param {object} options
 * @param {string} options.schemaPath
 * @returns {(function({object}): void)}
 */
export function resolveRefTransformer(options) {
  const schemaPath = options.schemaPath || './';
  return function (apiDefinition) {
    const modelsCache = new ModelsCache();
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
