/**
 * Resolves a component reference path to the actual component object.
 * @param {string} path - The reference path (e.g., '#/components/schemas/MySchema')
 * @param {object} components - The components object containing the schemas
 * @returns {object|undefined} The resolved component or undefined if not found
 */
export function resolveComponent(path, components) {
  const pathsToReplace = ['#/definitions/', '#/components/schemas/'];

  for (const pathToReplace of pathsToReplace) {
    const actualPath = path.replace(pathToReplace, '');

    if (components[actualPath]) {
      return components[actualPath];
    }
  }

  return undefined;
}
