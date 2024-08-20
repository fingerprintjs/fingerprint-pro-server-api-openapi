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
const BREAKING_CHANGES_HEADER = 'breaking-changes';

class InvalidReleaseNoteError extends Error {
  constructor() {
    super('Release note format is invalid or does not match expected pattern.');
  }
}

/**
 * @param {string} notes
 * */
export function parseNotes(notes) {
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
        .replace(
          /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
          ''
        )
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
      if (e instanceof InvalidReleaseNoteError && currentHeader === BREAKING_CHANGES_HEADER) {
        result[currentHeader].push({
          note: part.replace('*', '').trim(),
          commitTag: null,
          commitLink: null,
        });

        return;
      }

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
    const { message, scope } = extractScopeAndMessage(match.groups.note);

    return {
      note: message,
      scope,
      commitTag: match.groups.commitTag,
      commitLink: match.groups.commitLink,
    };
  }

  throw new InvalidReleaseNoteError();
}

function extractScopeAndMessage(note) {
  const regex = /^\*\s\*\*(\w+):\*\*\s*(.+)$/;

  const match = note.match(regex);

  if (match) {
    const scope = match[1];
    const message = match[2];

    return {
      message,
      scope,
    };
  }

  return {
    message: note.replace('*', '').trim(),
    scope: null,
  };
}
