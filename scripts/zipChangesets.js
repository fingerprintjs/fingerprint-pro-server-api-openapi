import { existsSync, globSync, mkdtempSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import { tmpdir } from 'node:os';
import zip from 'zip-lib';

/**
 * Archives the changesets that are about to be consumed by `changeset version`.
 *
 * `changeset version` deletes the `.changeset/*.md` files once it has folded them into the
 * changelog, but the SDK repositories still need them: they generate their own changelogs from
 * these changesets when they sync against a new version of this schema. So we snapshot them into
 * an archive that is committed alongside the release, attached to the GitHub release as an asset by
 * `scripts/uploadChangesets.cjs`, and then removed from `main` by the cleanup job in
 * `.github/workflows/upload-changesets.yml`.
 *
 * The cleanup job only runs after the asset upload succeeds, so an archive that is still here was
 * never delivered to the SDKs — a release that failed to publish, for example. Its changesets are
 * carried over into the new archive rather than overwritten, so they reach the SDKs with the next
 * release instead of being lost.
 */
const ARCHIVE_PATH = '.changeset/changesets.zip';

const changesets = globSync('.changeset/*.md');

if (changesets.length) {
  const archive = new zip.Zip();
  const archived = new Set();

  changesets.forEach((changeset) => {
    const name = basename(changeset);

    archive.addFile(changeset, name);
    archived.add(name);
  });

  if (existsSync(ARCHIVE_PATH)) {
    const undelivered = mkdtempSync(join(tmpdir(), 'changesets-'));

    await new zip.Unzip().extract(ARCHIVE_PATH, undelivered);

    // On a name clash the pending changeset wins — it is the newer of the two.
    readdirSync(undelivered)
      .filter((name) => !archived.has(name))
      .forEach((name) => archive.addFile(join(undelivered, name), name));
  }

  await archive.archive(ARCHIVE_PATH);
}
