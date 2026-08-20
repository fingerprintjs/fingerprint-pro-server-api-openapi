import { readFileSync } from 'fs';
import path from 'path';
import * as yaml from 'js-yaml';
import { walkJson } from '../walkJson.ts';
import type { OpenApiDocument, JsonObject, Transformer } from '../openapi.ts';

/**
 * Load and parse yaml file
 */
function loadYaml(path: string): any {
  return yaml.load(readFileSync(path, 'utf8'));
}

class ModelsCache {
  models: JsonObject;
  refs: Record<string, string>;

  constructor() {
    this.models = {};
    this.refs = {};
  }

  /**
   * Get model by $ref
   */
  get(modelRef: string, schemaPath: string = '.'): OpenApiDocument | string {
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

  serialize(): JsonObject {
    const result: JsonObject = {};
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
 */
function findAndResolveRefs(apiDefinition: OpenApiDocument, modelsCache: ModelsCache, schemaPath: string): void {
  const resolveRef = (parent: JsonObject, refProperty: string) => {
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
 */
export function resolveRefTransformer(options: JsonObject): Transformer {
  const schemaPath = options.schemaPath || './';
  return function (apiDefinition: OpenApiDocument): void {
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
