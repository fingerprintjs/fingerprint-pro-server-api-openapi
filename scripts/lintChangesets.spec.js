import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const SCRIPT = path.resolve('scripts/lintChangesets.js');

function run(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'changeset-lint-'));
  for (const [name, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(dir, name), content);
  }
  const result = spawnSync('node', [SCRIPT, dir], { encoding: 'utf8' });
  fs.rmSync(dir, { recursive: true, force: true });
  return result;
}

const frontmatter = "---\n'pkg': minor\n---\n\n";

describe('lintChangesets', () => {
  it('passes a well-formed changeset', () => {
    const { status } = run({
      'good.md': `${frontmatter}**events**: Add \`proxy_ml_score\` to \`Event\`\n`,
    });
    expect(status).toBe(0);
  });

  it('passes a multi-sentence entry ending in a period', () => {
    const { status } = run({
      'multi.md': `${frontmatter}**events**: Enable \`x\` for iOS. Only \`a\` is supported.\n`,
    });
    expect(status).toBe(0);
  });

  it('flags a lowercase first word', () => {
    const { status, stderr } = run({
      'bad.md': `${frontmatter}**events**: add Android platform support\n`,
    });
    expect(status).toBe(1);
    expect(stderr).toMatch(/should be capitalized/);
  });

  it('flags a single-sentence entry with a trailing period', () => {
    const { status, stderr } = run({
      'bad.md': `${frontmatter}**events**: Add \`foo\` field.\n`,
    });
    expect(status).toBe(1);
    expect(stderr).toMatch(/should not end with a period/);
  });

  it('flags a multi-sentence entry missing a trailing period', () => {
    const { status, stderr } = run({
      'bad.md': `${frontmatter}**events**: Add \`x\`. Also add \`y\`\n`,
    });
    expect(status).toBe(1);
    expect(stderr).toMatch(/should end with a period/);
  });

  it('flags a scope that is not in config/scopes.yaml', () => {
    const { status, stderr } = run({
      'bad.md': `${frontmatter}**unknown-scope**: Add \`x\` to \`Event\`\n`,
    });
    expect(status).toBe(1);
    expect(stderr).toMatch(/invalid scope "unknown-scope"/);
  });

  it('accepts a hyphenated scope from config/scopes.yaml', () => {
    const { status } = run({
      'good.md': `${frontmatter}**events-search**: Add \`q\` query parameter to search\n`,
    });
    expect(status).toBe(0);
  });

  it('accepts a changeset with no scope line', () => {
    const { status } = run({
      'good.md': `${frontmatter}Add \`x\` to \`Event\`\n`,
    });
    expect(status).toBe(0);
  });
});
