import yaml from 'js-yaml';

/**
 * Parses YAML content into an object-like document.
 * @param {Buffer | string} content
 * @returns {Record<string, any>}
 */
export function parseYaml(content) {
  return /** @type {Record<string, any>} */ (yaml.load(content.toString()));
}
