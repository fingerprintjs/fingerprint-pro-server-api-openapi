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
