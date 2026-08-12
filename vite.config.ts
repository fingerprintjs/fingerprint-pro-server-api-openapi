import 'dotenv/config';
import { defineConfig, type Plugin } from 'vite';
import { renderSchema, writeSchemas } from './scripts/build-schemas.js';

const outDir = 'dist';

// Generates the published schema files (replacing the old webpack CopyWebpackPlugin):
// served from memory in dev so Swagger UI can fetch them, and written into the build
// output on `vite build`.
function schemasPlugin(): Plugin {
  return {
    name: 'fingerprint-schemas',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = (req.url ?? '').split('?')[0].replace(/^\//, '');
        const yaml = path.startsWith('schemas/') ? renderSchema(path) : null;
        if (yaml === null) {
          next();
          return;
        }
        res.setHeader('Content-Type', 'text/yaml; charset=utf-8');
        res.end(yaml);
      });
    },
    closeBundle() {
      writeSchemas(outDir);
    },
  };
}

// The Swagger UI demo app, published to GitHub Pages.
export default defineConfig({
  // Relative base so assets resolve under the GitHub Pages subpath.
  base: './',
  build: {
    outDir,
    emptyOutDir: true,
  },
  define: {
    // Mirrors the previous webpack DefinePlugin; the demo preauthorizes Swagger UI
    // with this key at build time.
    'process.env.PRIVATE_KEY': JSON.stringify(process.env.PRIVATE_KEY ?? ''),
  },
  plugins: [schemasPlugin()],
});
