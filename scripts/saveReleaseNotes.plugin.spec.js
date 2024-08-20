import { parseNotes } from './saveReleaseNotes.plugin.js';

describe('Save release notes semantic-release plugin', () => {
  it('with correct notes', async () => {
    const commits = [
      {
        commit: {
          long: '45564cd351a8c1c40de5b7442d9ed0685a32889f',
          short: '45564cd',
        },
        subject: 'feat(signals): add remoteControl, velocity and developerTools signals',
      },
      {
        commit: {
          long: '3a4975d6f2641cffd132dce48700895c9301e1cd',
          short: '3a4975d',
        },
        subject: 'feat: improve thrown errors, introduce classes per specific error',
      },
      {
        commit: {
          long: 'cff61982ae13945e057a62d7db0004ae2bfe02c6',
          short: 'cff6198',
        },
        subject: 'feat: make tag field optional for Webhook',
      },
      {
        commit: {
          long: '3a4975d6f2641cffd132dce48700895c9301e1cd',
          short: '3a4975d',
        },
        subject: 'feat: improve thrown errors, introduce classes per specific error',
        body: `BREAKING CHANGE: renamed \`status\` in error object to \`statusCode\`
BREAKING CHANGE: to access response body in error use \`responseBody\` property, e.g: \`error.responseBody\
BREAKING CHANGE: rename \`ErrorVisitsDelete400Response\` to \`ErrorVisitor400Response\`
BREAKING CHANGE: rename \`ErrorVisitsDelete404ResponseError\` to \`ErrorVisitor404ResponseError\`
BREAKING CHANGE: rename \`ErrorVisitsDelete404Response\` to \`ErrorVisitor404Respons
`,
      },
      {
        commit: {
          long: 'cff61982ae13945e057a62d7db0004ae2bfe02c6',
          short: 'cff6198',
        },
        subject: 'feat: make tag field optional for Webhook',
      },
    ];
    const notes = `## [5.0.0](https://github.com/fingerprintjs/fingerprintjs-pro-server-api-node-sdk/compare/v4.1.2...v5.0.0) (2024-08-12)


### ⚠ BREAKING CHANGES

* rename \`ErrorVisitsDelete400Response\` to \`ErrorVisitor400Response\`
* rename \`ErrorVisitsDelete404ResponseError\` to \`ErrorVisitor404ResponseError\`
* rename \`ErrorVisitsDelete404Response\` to \`ErrorVisitor404Respons
* renamed \`status\` in error object to \`statusCode\`
* to access response body in error use \`responseBody\` property, e.g: \`error.responseBody\`

### Features

* **signals:** add remoteControl, velocity and developerTools signals ([45564cd](https://github.com/fingerprintjs/fingerprintjs-pro-server-api-node-sdk/commit/45564cd351a8c1c40de5b7442d9ed0685a32889f))
* improve thrown errors, introduce classes per specific error ([3a4975d](https://github.com/fingerprintjs/fingerprintjs-pro-server-api-node-sdk/commit/3a4975d6f2641cffd132dce48700895c9301e1cd))


### Bug Fixes

* make tag field optional for Webhook ([cff6198](https://github.com/fingerprintjs/fingerprintjs-pro-server-api-node-sdk/commit/cff61982ae13945e057a62d7db0004ae2bfe02c6))

### Build System

* **deps:** remove redundant packages ([da386da](https://github.com/fingerprintjs/fingerprintjs-pro-server-api-node-sdk/commit/da386dae91fc8b3a2710b24c06178b9fa4235e85))
`;

    const result = parseNotes(notes, commits);

    expect(result).toMatchSnapshot();
  });

  it('with incorrect notes', () => {
    const notes = `Incorrect...`;

    const result = parseNotes(notes, []);

    expect(result).toHaveLength(0);
  });
});
