import * as glob from 'glob';
import zip from 'zip-lib';
import { humanId } from 'human-id';

const changesets = glob.sync('.changeset/*.md');

if (changesets.length) {
  const archive = new zip.Zip();

  changesets.forEach((changeset) => {
    archive.addFile(changeset);
  });

  const fileName = `changesets-${humanId({ capitalize: false, separator: '-' })}.zip`;
  await archive.archive(fileName);
}
