import fs from 'fs';
import { walkJson } from '../walkJson.ts';
import type { OpenApiDocument, JsonObject, Transformer } from '../openapi.ts';

export function loadJson(path: string, examplesPath: string): any {
  return JSON.parse(fs.readFileSync(examplesPath + '/' + path).toString());
}

export function resolveExternalValueTransformer(options: JsonObject): Transformer {
  const examplesPath = options.examplesPath || './';
  return function (apiDefinition: OpenApiDocument): void {
    walkJson(apiDefinition, 'externalValue', (partWithKey) => {
      partWithKey.value = loadJson(partWithKey.externalValue, examplesPath);
      delete partWithKey.externalValue;
    });
  };
}
