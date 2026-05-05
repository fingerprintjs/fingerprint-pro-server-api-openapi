/**
 * @param {Object} json
 * @param {string} key
 * @param {Function} callback
 */
export function walkJson(json, key, callback) {
  Object.keys(json).forEach((iteratorKey) => {
    if (iteratorKey === key) {
      callback(json);
    } else if (json[iteratorKey] && typeof json[iteratorKey] === 'object') {
      walkJson(json[iteratorKey], key, callback);
    }
  });
}

/**
 * @param {Object} json
 * @param {string} prefix
 * @param {Function} callback - receives (obj, key) for each matching key
 */
export function walkJsonByPrefix(json, prefix, callback) {
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
 * Walk a JSON object to find the object containing the property identified by
 * the specified path.
 *
 * @param {Object} json
 * @param {string[]} pathSegments
 * @param {Function} callback  - receives (obj, key) that matches the specified path
 */
export function walkJsonByPath(json, pathSegments, callback) {
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
