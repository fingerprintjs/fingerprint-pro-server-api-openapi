import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const DIR = process.argv[2] ?? '.changeset';
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const SCOPES_PATH = path.resolve(scriptDir, '../config/scopes.yaml');
const validScopes = new Set(Object.keys(yaml.load(fs.readFileSync(SCOPES_PATH, 'utf8'))));

const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.md') && f !== 'README.md');

const issues = [];

for (const file of files) {
  const full = path.join(DIR, file);
  const lines = fs.readFileSync(full, 'utf8').split('\n');

  if (lines[0] !== '---') {
    issues.push(`${full}: missing frontmatter`);
    continue;
  }
  let i = 1;
  while (i < lines.length && lines[i] !== '---') i++;
  i++;
  while (i < lines.length && lines[i] === '') i++;

  const body = lines.slice(i).join('\n').trim();
  if (!body) {
    issues.push(`${full}: empty body`);
    continue;
  }

  const scopeMatch = body.match(/^\*\*([^*]+)\*\*:\s*/);
  if (scopeMatch) {
    const scope = scopeMatch[1];
    if (!validScopes.has(scope)) {
      const allowed = [...validScopes].sort().join(', ');
      issues.push(`${full}: invalid scope "${scope}" — use one of: ${allowed} (or omit the scope line)`);
    }
  }

  const withoutScope = body.replace(/^\*\*[^*]+\*\*:\s*/, '');
  const firstChar = withoutScope[0];

  if (firstChar && /[a-z]/.test(firstChar)) {
    issues.push(`${full}: first word should be capitalized — "${withoutScope.slice(0, 40)}…"`);
  }

  const multiSentence = /[.!?]\s/.test(withoutScope);
  const endsWithPeriod = /\.$/.test(withoutScope);

  if (!multiSentence && endsWithPeriod) {
    issues.push(`${full}: single-sentence entry should not end with a period`);
  }
  if (multiSentence && !endsWithPeriod) {
    issues.push(`${full}: multi-sentence entry should end with a period`);
  }
}

if (issues.length) {
  for (const msg of issues) console.error(msg);
  console.error(`\n${issues.length} changeset issue(s) in ${files.length} file(s)`);
  process.exit(1);
}

console.log(`${files.length} changeset(s) checked, no issues`);
