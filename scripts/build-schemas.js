// Generates the published schema files (and copies example fixtures) using a transformer pipeline.
// Consumed by the Vite plugin in vite.config.ts
import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  readmeApiExplorerTransformers,
  relatedVisitorsApiTransformers,
  removeExtraDocumentationTransformers,
  schemaForSdksTransformers,
  transformSchema,
  v4SchemaForSdksNormalizedTransformers,
  v4SchemaForSdksTransformers,
  v4Transformers,
} from '../utils/transformers/transformSchema.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// Source schema -> output path (+ transformer set). `transformers: undefined`
// uses the default set.
export const schemaOutputs = [
  {
    from: 'schemas/fingerprint-server-api-v4.yaml',
    // full schema used by docs.fingerprint.com, and other cases where examples are useful
    // includes examples same as the source schema
    // includes `oneOf` operators same as the source schema
    // includes additionalProperties: false same as the source schema
    to: 'schemas/fingerprint-server-api-v4-with-examples.yaml',
    transformers: v4Transformers,
  },
  {
    from: 'schemas/fingerprint-server-api-v4.yaml',
    // just schema used by most SDKs
    // examples are removed
    // includes `oneOf` operators same as the source schema
    // additionalProperties: false are removed for backward compatibility
    to: 'schemas/fingerprint-server-api-v4.yaml',
    transformers: v4SchemaForSdksTransformers,
  },
  {
    from: 'schemas/fingerprint-server-api-v4.yaml',
    // normalized schema used by SDKs in weakly typed languages
    // examples are removed
    // `oneOf` query parameters are split into two or more parameters
    // additionalProperties: false are removed for backward compatibility
    to: 'schemas/fingerprint-server-api-v4-normalized.yaml',
    transformers: v4SchemaForSdksNormalizedTransformers,
  },
  {
    from: 'schemas/fingerprint-server-api-for-sdks.yaml',
    to: 'schemas/fingerprint-server-api.yaml',
    transformers: undefined,
  },
  {
    from: 'schemas/fingerprint-related-visitors-api-readme-explorer.yaml',
    to: 'schemas/fingerprint-related-visitors-api-readme-explorer.yaml',
    transformers: relatedVisitorsApiTransformers,
  },
  {
    from: 'schemas/fingerprint-server-api-readme-explorer.yaml',
    to: 'schemas/fingerprint-server-api-readme-explorer.yaml',
    transformers: readmeApiExplorerTransformers,
  },
  {
    from: 'schemas/fingerprint-server-api-for-sdks.yaml',
    to: 'schemas/fingerprint-server-api-compact.yaml',
    transformers: removeExtraDocumentationTransformers,
  },
  {
    from: 'schemas/fingerprint-server-api-for-sdks.yaml',
    to: 'schemas/fingerprint-server-api-schema-for-sdks.yaml',
    transformers: schemaForSdksTransformers,
  },
];

// Renders one output schema (by its `to` path) from source. Returns null if the
// path is not a known output.
export function renderSchema(to) {
  const entry = schemaOutputs.find((output) => output.to === to);
  if (!entry) {
    return null;
  }
  const content = readFileSync(join(root, entry.from));
  return entry.transformers ? transformSchema(content, entry.transformers) : transformSchema(content);
}

// Writes all generated schemas and copies example fixtures (excluding `edge/`)
// into `outDir` (relative to the repo root).
export function writeSchemas(outDir) {
  const base = join(root, outDir);
  for (const { to } of schemaOutputs) {
    mkdirSync(dirname(join(base, to)), { recursive: true });
    writeFileSync(join(base, to), renderSchema(to));
  }
  cpSync(join(root, 'schemas/paths/examples'), join(base, 'examples'), {
    recursive: true,
    filter: (src) => !/[/\\]examples[/\\]edge([/\\]|$)/.test(src),
  });
}
