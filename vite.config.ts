import 'dotenv/config';
import { defineConfig, type Plugin } from 'vite';
import { renderSchema, writeSchemas } from './scripts/build-schemas.js';

const outDir = 'dist';

// Generates the published schema files
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
  plugins: [schemasPlugin()],
});
