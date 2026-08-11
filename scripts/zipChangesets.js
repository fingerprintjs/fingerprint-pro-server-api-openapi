import { globSync } from 'node:fs';
import { humanId } from 'human-id';
import zip from 'zip-lib';

const changesets = globSync('.changeset/*.md');

if (changesets.length) {
  const archive = new zip.Zip();

  changesets.forEach((changeset) => {
    archive.addFile(changeset);
  });

  const fileName = `.changeset/changesets-${humanId({ capitalize: false, separator: '-' })}.zip`;
  await archive.archive(fileName);
}
