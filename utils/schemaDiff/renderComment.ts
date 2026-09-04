export const SCHEMA_DIFF_COMMENT_MARKER = '<!-- schema-diff-comment:v1 -->';
const GITHUB_COMMENT_MAX_BYTES = 65_536;

type CommentDetailLevel = 'full' | 'elements' | 'summary';

interface SchemaDiffFileSummary {
  addedElements: string[];
  removedElements: string[];
  modifiedElements: string[];
  addedCount: number;
  removedCount: number;
  modifiedCount: number;
}

interface SchemaDiffFile {
  fileName: string;
  remoteUrl: string;
  changed: boolean;
  isNew?: boolean;
  isDeleted?: boolean;
  summary: SchemaDiffFileSummary;
  patch: string;
}

interface SchemaDiffReport {
  generatedAt: string;
  baseUrl: string;
  comparedCount: number;
  changedCount: number;
  newFiles?: string[];
  deletedFiles?: string[];
  files: SchemaDiffFile[];
}

function appendElementDetails(lines: string[], label: string, elements: string[]): void {
  lines.push('<details>');
  lines.push(`<summary>${label} (${elements.length})</summary>`);
  lines.push('');

  if (elements.length === 0) {
    lines.push('_None_');
  } else {
    elements.forEach((element) => {
      lines.push(`- \`${element}\``);
    });
  }

  lines.push('</details>');
}

function getFileStatusLabel(file: SchemaDiffFile): string {
  if (file.isNew) return ' 🆕 NEW';
  if (file.isDeleted) return ' 🗑️ DELETED';
  return '';
}

function renderSchemaDiffCommentWithDetail(report: SchemaDiffReport, detailLevel: CommentDetailLevel): string {
  const changedFiles = report.files.filter((file) => file.changed).sort((a, b) => a.fileName.localeCompare(b.fileName));
  const newCount = report.newFiles?.length || 0;
  const deletedCount = report.deletedFiles?.length || 0;
  const lines = [
    SCHEMA_DIFF_COMMENT_MARKER,
    '## Schema Diff vs Published Schemas',
    `- Generated at: \`${report.generatedAt}\``,
    `- Published source: \`${report.baseUrl}\``,
    `- Compared schemas: \`${report.comparedCount}\``,
    `- Changed schemas: \`${report.changedCount}\`${newCount > 0 ? ` (${newCount} new)` : ''}${deletedCount > 0 ? ` (${deletedCount} deleted)` : ''}`,
    '',
  ];

  if (changedFiles.length === 0) {
    lines.push('No schema changes detected between local build output and published GitHub Pages schemas.');
    return lines.join('\n').trim();
  }

  if (detailLevel === 'elements') {
    lines.push(
      '> Detailed changed-lines patches were omitted because the complete report exceeds GitHub’s comment size limit.',
      ''
    );
  } else if (detailLevel === 'summary') {
    lines.push(
      '> Element lists and changed-lines patches were omitted because the complete report exceeds GitHub’s comment size limit.',
      ''
    );
  }

  for (const file of changedFiles) {
    const statusLabel = getFileStatusLabel(file);
    lines.push(`### \`${file.fileName}\`${statusLabel}`);

    if (file.isDeleted) {
      lines.push(`Published URL: ${file.remoteUrl}`);
      lines.push('This schema file has been **deleted** from the local build.');
      lines.push('');
      continue;
    }

    if (!file.isNew) {
      lines.push(`Published URL: ${file.remoteUrl}`);
    }

    lines.push(
      `Summary: +${file.summary.addedCount} added, -${file.summary.removedCount} removed, ~${file.summary.modifiedCount} modified`
    );
    if (detailLevel !== 'summary') {
      appendElementDetails(lines, 'Added elements', file.summary.addedElements);
      appendElementDetails(lines, 'Removed elements', file.summary.removedElements);
      appendElementDetails(lines, 'Modified elements', file.summary.modifiedElements);
    }
    if (detailLevel === 'full') {
      lines.push('<details>');
      lines.push('<summary>Changed lines patch</summary>');
      lines.push('');
      lines.push('```diff');
      lines.push(file.patch || '# No textual patch generated');
      lines.push('```');
      lines.push('</details>');
    }
    lines.push('');
  }

  return lines.join('\n').trim();
}

function fitsGitHubCommentLimit(comment: string): boolean {
  return Buffer.byteLength(comment, 'utf8') <= GITHUB_COMMENT_MAX_BYTES;
}

export function renderSchemaDiffComment(report: SchemaDiffReport): string {
  const fullComment = renderSchemaDiffCommentWithDetail(report, 'full');
  if (fitsGitHubCommentLimit(fullComment)) return fullComment;

  const elementsComment = renderSchemaDiffCommentWithDetail(report, 'elements');
  if (fitsGitHubCommentLimit(elementsComment)) return elementsComment;

  const summaryComment = renderSchemaDiffCommentWithDetail(report, 'summary');
  if (fitsGitHubCommentLimit(summaryComment)) return summaryComment;

  return [
    SCHEMA_DIFF_COMMENT_MARKER,
    '## Schema Diff vs Published Schemas',
    '',
    '> Per-schema details were omitted because the report exceeds GitHub’s comment size limit.',
    '',
    `Changed schemas: \`${report.changedCount}\` of \`${report.comparedCount}\``,
  ].join('\n');
}
