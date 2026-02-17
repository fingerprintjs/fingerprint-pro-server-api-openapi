import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { compareYamlObjects } from '../utils/schemaDiff/compareSchemas.js';
import { renderSchemaDiffComment } from '../utils/schemaDiff/renderComment.js';
import { buildUnifiedPatch } from '../utils/schemaDiff/unifiedPatch.js';

const DEFAULT_BASE_URL = 'https://fingerprintjs.github.io/fingerprint-pro-server-api-openapi/schemas';
const DEFAULT_LOCAL_DIR = 'dist/schemas';

function toAbsolutePath(filePath) {
  return path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
}

/**
 * @param {string} content
 * @param {string} sourceLabel
 */
function parseYamlOrThrow(content, sourceLabel) {
  try {
    return yaml.load(content);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Unable to parse YAML from ${sourceLabel}: ${message}`);
  }
}

function listSchemaFiles(localDir) {
  if (!fs.existsSync(localDir)) {
    throw new Error(`Local schema directory does not exist: ${localDir}`);
  }

  const files = fs
    .readdirSync(localDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.yaml'))
    .map((entry) => entry.name)
    .sort();

  if (files.length === 0) {
    throw new Error(`No YAML schemas found in: ${localDir}`);
  }

  return files;
}

/**
 * @param {string[]} argv
 */
export function parseArgs(argv) {
  const options = {
    baseUrl: DEFAULT_BASE_URL,
    localDir: DEFAULT_LOCAL_DIR,
    jsonOut: null,
    commentOut: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const nextArg = argv[index + 1];

    if (arg === '--base-url') {
      if (!nextArg) {
        throw new Error('Missing value for --base-url');
      }
      options.baseUrl = nextArg;
      index += 1;
      continue;
    }

    if (arg.startsWith('--base-url=')) {
      options.baseUrl = arg.split('=').slice(1).join('=');
      continue;
    }

    if (arg === '--local-dir') {
      if (!nextArg) {
        throw new Error('Missing value for --local-dir');
      }
      options.localDir = nextArg;
      index += 1;
      continue;
    }

    if (arg.startsWith('--local-dir=')) {
      options.localDir = arg.split('=').slice(1).join('=');
      continue;
    }

    if (arg === '--json-out') {
      if (!nextArg) {
        throw new Error('Missing value for --json-out');
      }
      options.jsonOut = nextArg;
      index += 1;
      continue;
    }

    if (arg.startsWith('--json-out=')) {
      options.jsonOut = arg.split('=').slice(1).join('=');
      continue;
    }

    if (arg === '--comment-out') {
      if (!nextArg) {
        throw new Error('Missing value for --comment-out');
      }
      options.commentOut = nextArg;
      index += 1;
      continue;
    }

    if (arg.startsWith('--comment-out=')) {
      options.commentOut = arg.split('=').slice(1).join('=');
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

/**
 * @param {{
 *  baseUrl?: string,
 *  localDir?: string,
 *  jsonOut?: string | null,
 *  commentOut?: string | null
 * }} options
 * @param {{
 *  fetchImpl?: typeof fetch,
 *  now?: () => Date
 * }} deps
 */
export async function runSchemaDiffPublished(options = {}, deps = {}) {
  const baseUrl = (options.baseUrl || DEFAULT_BASE_URL).replace(/\/$/, '');
  const localDir = toAbsolutePath(options.localDir || DEFAULT_LOCAL_DIR);
  const jsonOut = options.jsonOut ? toAbsolutePath(options.jsonOut) : null;
  const commentOut = options.commentOut ? toAbsolutePath(options.commentOut) : null;
  const fetchImpl = deps.fetchImpl || globalThis.fetch;
  const now = deps.now || (() => new Date());

  if (typeof fetchImpl !== 'function') {
    throw new Error('Fetch implementation is not available in this environment.');
  }

  const schemaFiles = listSchemaFiles(localDir);
  const fileResults = [];

  for (const fileName of schemaFiles) {
    const localPath = path.join(localDir, fileName);
    const remoteUrl = `${baseUrl}/${fileName}`;
    const localContent = fs.readFileSync(localPath, 'utf8');

    const response = await fetchImpl(remoteUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch published schema ${remoteUrl}: HTTP ${response.status}`);
    }

    const remoteContent = await response.text();
    const remoteParsed = parseYamlOrThrow(remoteContent, remoteUrl);
    const localParsed = parseYamlOrThrow(localContent, localPath);
    const changed = remoteContent !== localContent;
    const summary = compareYamlObjects(remoteParsed, localParsed);
    const patch = changed ? buildUnifiedPatch(remoteContent, localContent, `schemas/${fileName}`) : '';

    fileResults.push({
      fileName,
      localPath,
      remoteUrl,
      changed,
      summary,
      patch,
    });
  }

  const changedFiles = fileResults.filter((file) => file.changed).map((file) => file.fileName);
  const report = {
    generatedAt: now().toISOString(),
    baseUrl,
    localDir,
    comparedCount: fileResults.length,
    changedCount: changedFiles.length,
    changedFiles,
    files: fileResults,
  };
  const comment = renderSchemaDiffComment(report);

  if (jsonOut) {
    fs.mkdirSync(path.dirname(jsonOut), { recursive: true });
    fs.writeFileSync(jsonOut, JSON.stringify(report, null, 2), 'utf8');
  }

  if (commentOut) {
    fs.mkdirSync(path.dirname(commentOut), { recursive: true });
    fs.writeFileSync(commentOut, `${comment}\n`, 'utf8');
  }

  if (!commentOut) {
    console.log(comment);
  }

  return report;
}

const isMainModule = (() => {
  if (!process.argv[1]) {
    return false;
  }

  return path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
})();

if (isMainModule) {
  const options = parseArgs(process.argv.slice(2));

  runSchemaDiffPublished(options).catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Schema diff failed: ${message}`);
    process.exit(1);
  });
}
