import * as yaml from 'js-yaml';
import type { OpenApiDocument } from '../openapi.ts';

/**
 * Parses YAML content into an object-like document.
 */
export function parseYaml(content: Buffer | string): OpenApiDocument {
  return yaml.load(content.toString()) as OpenApiDocument;
}

/**
 * Serializes an object into a YAML document.
 */
export function toYaml(input: unknown): string {
  return yaml.dump(input);
}
