import type { JsonObject, OpenApiDocument } from '../openapi.ts';

type PathSegment = string | number;

interface SchemaDiffSummary {
  addedElements: string[];
  removedElements: string[];
  modifiedElements: string[];
}

function isPlainObject(value: unknown): value is JsonObject {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function encodePathSegment(segment: PathSegment): string {
  return String(segment).replaceAll('~', '~0').replaceAll('/', '~1');
}

function toJsonPointer(pathSegments: PathSegment[]): string {
  if (pathSegments.length === 0) {
    return '/';
  }

  return `/${pathSegments.map((segment) => encodePathSegment(segment)).join('/')}`;
}

function compareValues(
  remoteValue: unknown,
  localValue: unknown,
  pathSegments: PathSegment[],
  summary: SchemaDiffSummary
): void {
  if (Array.isArray(remoteValue) && Array.isArray(localValue)) {
    const maxLength = Math.max(remoteValue.length, localValue.length);
    for (let index = 0; index < maxLength; index += 1) {
      const nextPath = [...pathSegments, index];
      const hasRemote = index < remoteValue.length;
      const hasLocal = index < localValue.length;

      if (!hasRemote && hasLocal) {
        summary.addedElements.push(toJsonPointer(nextPath));
        continue;
      }

      if (hasRemote && !hasLocal) {
        summary.removedElements.push(toJsonPointer(nextPath));
        continue;
      }

      compareValues(remoteValue[index], localValue[index], nextPath, summary);
    }

    return;
  }

  if (isPlainObject(remoteValue) && isPlainObject(localValue)) {
    const remoteKeys = Object.keys(remoteValue);
    const localKeys = Object.keys(localValue);
    const allKeys = new Set([...remoteKeys, ...localKeys]);

    [...allKeys].sort().forEach((key) => {
      const nextPath = [...pathSegments, key];
      const hasRemote = Object.hasOwn(remoteValue, key);
      const hasLocal = Object.hasOwn(localValue, key);

      if (!hasRemote && hasLocal) {
        summary.addedElements.push(toJsonPointer(nextPath));
        return;
      }

      if (hasRemote && !hasLocal) {
        summary.removedElements.push(toJsonPointer(nextPath));
        return;
      }

      compareValues(remoteValue[key], localValue[key], nextPath, summary);
    });

    return;
  }

  if (!Object.is(remoteValue, localValue)) {
    summary.modifiedElements.push(toJsonPointer(pathSegments));
  }
}

/**
 * Compares two parsed YAML schema objects and returns a semantic path-level summary.
 */
export function compareYamlObjects(remoteSchema: OpenApiDocument, localSchema: OpenApiDocument) {
  const summary: SchemaDiffSummary = {
    addedElements: [],
    removedElements: [],
    modifiedElements: [],
  };

  compareValues(remoteSchema, localSchema, [], summary);

  summary.addedElements.sort();
  summary.removedElements.sort();
  summary.modifiedElements.sort();

  return {
    ...summary,
    addedCount: summary.addedElements.length,
    removedCount: summary.removedElements.length,
    modifiedCount: summary.modifiedElements.length,
  };
}
