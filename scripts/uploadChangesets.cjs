const fs = require('fs').promises;
const { existsSync } = require('node:fs');

// Keep in sync with ARCHIVE_PATH in scripts/zipChangesets.ts.
const ARCHIVE_PATH = '.changeset/changesets.zip';

// The SDK sync looks the release asset up by this exact name, so it must not change.
const ASSET_NAME = 'changesets.zip';

module.exports = async ({ github, context }) => {
  if (!existsSync(ARCHIVE_PATH)) {
    throw new Error(
      `${ARCHIVE_PATH} is missing, so this release would ship without changesets and the SDK syncs would fail. ` +
        'It should have been committed to the release PR by `pnpm changeset-version`.'
    );
  }

  await github.rest.repos.uploadReleaseAsset({
    name: ASSET_NAME,
    owner: context.repo.owner,
    repo: context.repo.repo,
    release_id: context.payload.release.id,
    data: await fs.readFile(ARCHIVE_PATH),
    headers: {
      'content-type': 'application/zip',
    },
  });
};
