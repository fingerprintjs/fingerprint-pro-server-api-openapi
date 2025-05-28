import prompt from 'prompts';
import pkg from '../package.json' with { type: 'json' };
import { humanId } from 'human-id';
import fs from 'fs';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';
import path from 'path';

const dirname = path.dirname(fileURLToPath(import.meta.url));

const scopesYaml = yaml.load(fs.readFileSync(path.resolve(dirname, '../config/scopes.yaml')));
const scopes = Object.keys(scopesYaml);

const data = await prompt([
  {
    type: 'select',
    message: 'Select version',
    name: 'version',
    choices: [
      {
        value: 'major',
        title: 'major',
      },
      {
        value: 'minor',
        title: 'minor',
      },
      {
        value: 'patch',
        title: 'patch',
      },
    ],
  },
  {
    type: 'text',
    name: 'description',
    message: (prev) => {
      const parts = ['Describe the changes'];

      if (prev === 'major') {
        parts.push('⚠️ Major bump detected');
        parts.push('⚠️ Remember to provide a reason for the major version bump');
      }

      return parts.join('\n');
    },
    validate: (v) => (v ? true : 'Description is required'),
  },
  {
    type: 'select',
    name: 'scope',
    message: 'Select scope of the changes',
    choices: [
      {
        value: null,
        title: '[no scope] - change has no scope or affects multiple scopes',
      },
      ...scopes.map((s) => ({
        value: s,
        title: s,
      })),
    ],
  },
]);

const description = data.scope ? `**${data.scope}**: ${data.description}` : data.description;
if (description) {
  const changeset = `
---
'${pkg.name}': ${data.version}
---

${description}

  `.trim();

  const fileName = `${humanId({ separator: '-', capitalize: false })}.md`;
  const filePath = `.changeset/${fileName}`;

  fs.writeFileSync(filePath, changeset, 'utf-8');

  console.info(`✅ Created changeset ${fileName}. \n\n${changeset}`);
} else {
  console.info(`❌ Changeset creation cancelled`);
}
