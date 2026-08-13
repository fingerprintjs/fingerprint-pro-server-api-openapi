import type { JsonObject } from './openapi.ts';

type KeyCallback = (obj: JsonObject, key: string) => void;

export function walkJson(json: JsonObject, key: string, callback: (obj: JsonObject) => void): void {
  Object.keys(json).forEach((iteratorKey) => {
    if (iteratorKey === key) {
      callback(json);
    } else if (json[iteratorKey] && typeof json[iteratorKey] === 'object') {
      walkJson(json[iteratorKey], key, callback);
    }
  });
}

export function walkJsonByPrefix(json: JsonObject, prefix: string, callback: KeyCallback): void {
  Object.keys(json).forEach((iteratorKey) => {
    if (iteratorKey.startsWith(prefix)) {
      callback(json, iteratorKey);
    }
    if (json[iteratorKey] && typeof json[iteratorKey] === 'object') {
      walkJsonByPrefix(json[iteratorKey], prefix, callback);
    }
  });
}

/**
 * Walk a JSON object to find the object containing the property identified by the
 * specified path. The callback receives the matching (obj, key).
 */
export function walkJsonByPath(json: JsonObject, pathSegments: string[], callback: KeyCallback): void {
  Object.keys(json).forEach((iteratorKey) => {
    const [currentSegment, ...remainingSegments] = pathSegments;
    if (currentSegment && (iteratorKey === currentSegment || currentSegment === '*')) {
      const value = json[iteratorKey];
      if (value) {
        if (remainingSegments.length === 0) {
          // The target of the path has been found
          callback(json, iteratorKey);
        } else if (typeof value === 'object') {
          walkJsonByPath(value, remainingSegments, callback);
        }
      }
    }
  });
}
