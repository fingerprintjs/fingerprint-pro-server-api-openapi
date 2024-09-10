import prompt from 'prompts';
import pkg from '../package.json' assert { type: 'json' };
import { humanId } from 'human-id';
import fs from 'fs';

const scopes = ['events', 'related-visitors', 'visitors', 'webhook'];

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
    choices: scopes.map((s) => ({
      value: s,
      title: s,
    })),
  },
]);

const description = data.scope ? `**${data.scope}**: ${data.description}` : data.description;

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
