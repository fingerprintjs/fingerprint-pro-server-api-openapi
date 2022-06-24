export function walkJson(json, key, callback) {
  Object.keys(json).forEach((iteratorKey) => {
    if (iteratorKey === key) {
      callback(json);
    } else if (json[iteratorKey] && typeof json[iteratorKey] === 'object') {
      walkJson(json[iteratorKey], key, callback);
    }
  });
}
