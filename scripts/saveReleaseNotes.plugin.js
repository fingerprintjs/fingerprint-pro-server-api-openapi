import fs from 'fs';

/**
 * @param {Object} config
 * @param {import('semantic-release').GenerateNotesContext} context
 * */
export async function generateNotes(config, context) {
  const parsedNotes = parseNotes(context.nextRelease.notes);

  console.log(parsedNotes);

  fs.writeFileSync('./release-notes.json', JSON.stringify(parsedNotes));
}

const HEADER_INDICATOR = '###';

/**
 * @param {string} notes
 * */
function parseNotes(notes) {
  let currentHeader = '';
  const result = {};
  const seenNotes = new Set();

  notes.split('\n').forEach((part) => {
    if (!part) {
      return;
    }

    if (part.startsWith(HEADER_INDICATOR)) {
      currentHeader = part
        .replace(HEADER_INDICATOR, '')
        .trim()
        .toLowerCase()
        // Replace whitespaces with dash
        .replace(/\s+/g, '-');

      return;
    }

    if (!currentHeader || seenNotes.has(part)) {
      return;
    }

    if (!result[currentHeader]) {
      result[currentHeader] = [];
    }

    try {
      const note = extractReleaseNoteData(part);
      result[currentHeader].push(note);
    } catch (e) {
      console.error(`Failed to parse note ${part}`, e);
    }

    seenNotes.add(part);
  });

  return Object.entries(result).reduce(
    (acc, [type, notes]) => [
      ...acc,
      {
        type,
        notes,
      },
    ],
    []
  );
}

/**
 * Extracts the note, commit tag, and commit link from a release note string.
 * @param {string} releaseNote - The release note string to parse.
 * @returns {{note: string, commitTag: string, commitLink: string}} - Extracted data as an object.
 */
function extractReleaseNoteData(releaseNote) {
  const regex = /^(?<note>.*?)\s\(\[(?<commitTag>[a-f0-9]+)]\((?<commitLink>https:\/\/github.com\/[^)]+)\)\)$/;
  const match = releaseNote.match(regex);

  if (match && match.groups) {
    return {
      note: match.groups.note.replace('*', '').trim(),
      commitTag: match.groups.commitTag,
      commitLink: match.groups.commitLink,
    };
  } else {
    throw new Error('Release note format is invalid or does not match expected pattern.');
  }
}
