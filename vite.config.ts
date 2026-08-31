import 'dotenv/config';
import { defineConfig, type Plugin } from 'vite';
import { viteStaticCopy, type Target } from 'vite-plugin-static-copy';
import {
  readmeApiExplorerTransformers,
  relatedVisitorsApiTransformers,
  removeExtraDocumentationTransformers,
  schemaForSdksTransformers,
  transformSchema,
  v4SchemaForSdksNormalizedTransformers,
  v4SchemaForSdksTransformers,
  v4Transformers,
} from './utils/transformers/transformSchema.ts';

const outDir = 'dist';

const schemaOutputs = [
  {
    from: 'schemas/fingerprint-server-api-v4.yaml',
    // full schema used by docs.fingerprint.com, and other cases where examples are useful
    // includes examples same as the source schema
    // includes `oneOf` operators same as the source schema
    // includes additionalProperties: false same as the source schema
    to: 'fingerprint-server-api-v4-with-examples.yaml',
    transformers: v4Transformers,
  },
  {
    from: 'schemas/fingerprint-server-api-v4.yaml',
    // just schema used by most SDKs
    // examples are removed
    // includes `oneOf` operators same as the source schema
    // additionalProperties: false are removed for backward compatibility
    to: 'fingerprint-server-api-v4.yaml',
    transformers: v4SchemaForSdksTransformers,
  },
  {
    from: 'schemas/fingerprint-server-api-v4.yaml',
    // normalized schema used by SDKs in weakly typed languages
    // examples are removed
    // `oneOf` query parameters are split into two or more parameters
    // additionalProperties: false are removed for backward compatibility
    to: 'fingerprint-server-api-v4-normalized.yaml',
    transformers: v4SchemaForSdksNormalizedTransformers,
  },
  {
    from: 'schemas/fingerprint-server-api-for-sdks.yaml',
    to: 'fingerprint-server-api.yaml',
    transformers: undefined,
  },
  {
    from: 'schemas/fingerprint-related-visitors-api-readme-explorer.yaml',
    to: 'fingerprint-related-visitors-api-readme-explorer.yaml',
    transformers: relatedVisitorsApiTransformers,
  },
  {
    from: 'schemas/fingerprint-server-api-readme-explorer.yaml',
    to: 'fingerprint-server-api-readme-explorer.yaml',
    transformers: readmeApiExplorerTransformers,
  },
  {
    from: 'schemas/fingerprint-server-api-for-sdks.yaml',
    to: 'fingerprint-server-api-compact.yaml',
    transformers: removeExtraDocumentationTransformers,
  },
  {
    from: 'schemas/fingerprint-server-api-for-sdks.yaml',
    to: 'fingerprint-server-api-schema-for-sdks.yaml',
    transformers: schemaForSdksTransformers,
  },
];

const schemaManifest = (): Plugin => ({
  name: 'schema-manifest',
  generateBundle() {
    this.emitFile({
      type: 'asset',
      fileName: 'schemas/index.json',
      source: `${JSON.stringify({ files: schemaOutputs.map(({ to }) => to).sort() }, null, 2)}\n`,
    });
  },
});

// The Swagger UI app
export default defineConfig({
  base: './',
  build: {
    outDir,
    emptyOutDir: true,
  },
  define: {
    'process.env.PRIVATE_KEY': JSON.stringify(process.env.PRIVATE_KEY ?? ''),
  },
  plugins: [
    schemaManifest(),
    viteStaticCopy({
      targets: [
        ...schemaOutputs.map(({ from, to, transformers }): Target => ({
          src: from,
          dest: 'schemas',
          rename: { stripBase: true, name: to },
          transform: (content: string) =>
            transformers ? transformSchema(content, transformers) : transformSchema(content),
        })),
        {
          src: ['schemas/paths/examples/**/*', '!schemas/paths/examples/edge/**'],
          dest: 'examples',
          rename: { stripBase: 3 },
        },
      ],
    }),
  ],
});
