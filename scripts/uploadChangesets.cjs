const fs = require('fs').promises;
const glob = require('glob');
const zipLib = require('zip-lib');
const os = require('os');
const path = require('node:path');
const humanId = require('human-id').humanId;

module.exports = async ({ github, context }) => {
  // Read all zipped changesets
  const zips = glob.sync('changesets-*.zip');

  // Root archive that will contain all zips contents
  const rootArchive = new zipLib.Zip();

  const tmpDir = path.join(os.tmpdir(), humanId({ capitalize: false, separator: '-' }));
  await fs.mkdir(tmpDir);

  await Promise.all(
    zips.map(async (zip) => {
      const archive = new zipLib.Unzip();

      await archive.extract(zip, tmpDir);
    })
  );

  await rootArchive.addFolder(tmpDir);
  await rootArchive.archive('changesets.zip');

  await github.rest.repos.uploadReleaseAsset({
    name: 'changesets.zip',
    owner: context.repo.owner,
    repo: context.repo.repo,
    release_id: github.event.release.id,
    data: await fs.readFile('changesets.zip'),
    headers: {
      'content-type': 'application/zip',
    },
  });
};
