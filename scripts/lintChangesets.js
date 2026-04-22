import fs from 'node:fs';
import path from 'node:path';

const DIR = process.argv[2] ?? '.changeset';

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
