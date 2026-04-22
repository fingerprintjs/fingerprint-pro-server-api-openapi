import yaml from 'js-yaml';

/**
 * Parses YAML content into an object-like document.
 * @param {Buffer | string} content
 * @returns {Record<string, any>}
 */
export function parseYaml(content) {
  return /** @type {Record<string, any>} */ (yaml.load(content.toString()));
}

/**
 * Serializes an object into a YAML document.
 *
 * @param {unknown} input
 * @returns {string}
 */
export function toYaml(input) {
  return yaml.dump(input);
}
