import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * Builds a unified patch between remote and local content.
 * @param {string} remoteContent
 * @param {string} localContent
 * @param {string} fileLabel
 * @param {{ contextLines?: number }} [options]
 */
export function buildUnifiedPatch(remoteContent, localContent, fileLabel, options = {}) {
  const { contextLines = 5 } = options;
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'schema-diff-'));
  const remotePath = path.join(tempDir, 'remote.yaml');
  const localPath = path.join(tempDir, 'local.yaml');

  try {
    fs.writeFileSync(remotePath, remoteContent, 'utf8');
    fs.writeFileSync(localPath, localContent, 'utf8');

    const result = spawnSync(
      'diff',
      [`-U${contextLines}`, '--label', `a/${fileLabel}`, '--label', `b/${fileLabel}`, remotePath, localPath],
      {
        encoding: 'utf8',
      }
    );

    if (result.error) {
      throw result.error;
    }

    if (result.status === 0) {
      return '';
    }

    if (result.status === 1) {
      return (result.stdout || '').trim();
    }

    throw new Error(`Failed to generate diff patch: ${result.stderr || `exit code ${result.status}`}`);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}
