import * as glob from 'glob';
import { humanId } from 'human-id';
import zip from 'zip-lib';

const changesets = glob.sync('.changeset/*.md');

if (changesets.length) {
  const archive = new zip.Zip();

  changesets.forEach((changeset) => {
    archive.addFile(changeset);
  });

  const fileName = `.changeset/changesets-${humanId({ capitalize: false, separator: '-' })}.zip`;
  await archive.archive(fileName);
}
