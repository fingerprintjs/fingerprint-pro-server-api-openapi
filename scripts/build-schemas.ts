// Generates the published schema files (and copies example fixtures) using the
// same transformer pipeline the old webpack CopyWebpackPlugin used. Consumed by
// the Vite plugin in vite.config.ts: served from memory in dev, written to the
// build output on `vite build`.
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
} from '../utils/transformers/transformSchema.ts';
import type { Transformer } from '../utils/openapi.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

interface SchemaOutput {
  from: string;
  to: string;
  transformers: Transformer[] | undefined;
}

// Source schema -> output path (+ transformer set). `transformers: undefined`
// uses the default set. Mirrors the previous webpack CopyWebpackPlugin patterns.
export const schemaOutputs: SchemaOutput[] = [
  {
    from: 'schemas/fingerprint-server-api-v4.yaml',
    to: 'schemas/fingerprint-server-api-v4-with-examples.yaml',
    transformers: v4Transformers,
  },
  {
    from: 'schemas/fingerprint-server-api-v4.yaml',
    to: 'schemas/fingerprint-server-api-v4.yaml',
    transformers: v4SchemaForSdksTransformers,
  },
  {
    from: 'schemas/fingerprint-server-api-v4.yaml',
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
// path is not a known output. Used by the dev server to serve schemas on demand.
export function renderSchema(to: string): string | null {
  const entry = schemaOutputs.find((output) => output.to === to);
  if (!entry) {
    return null;
  }
  const content = readFileSync(join(root, entry.from));
  return entry.transformers ? transformSchema(content, entry.transformers) : transformSchema(content);
}

// Writes all generated schemas and copies example fixtures (excluding `edge/`)
// into `outDir` (relative to the repo root). Used by the build.
export function writeSchemas(outDir: string): void {
  const base = join(root, outDir);
  for (const { to } of schemaOutputs) {
    const rendered = renderSchema(to);
    if (rendered === null) {
      continue;
    }
    mkdirSync(dirname(join(base, to)), { recursive: true });
    writeFileSync(join(base, to), rendered);
  }
  cpSync(join(root, 'schemas/paths/examples'), join(base, 'examples'), {
    recursive: true,
    filter: (src) => !/[/\\]examples[/\\]edge([/\\]|$)/.test(src),
  });
}
