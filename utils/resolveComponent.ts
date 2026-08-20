import type { OpenApiDocument } from './openapi.ts';

/**
 * Resolves a component reference path to the actual component object.
 * The `path` is the reference path (e.g., '#/components/schemas/MySchema')
 * and `components` is the components object containing the schemas.
 * Returns the resolved component or undefined if not found.
 */
export function resolveComponent(path: string, components: OpenApiDocument): OpenApiDocument | undefined {
  const pathsToReplace = ['#/definitions/', '#/components/schemas/'];

  for (const pathToReplace of pathsToReplace) {
    const actualPath = path.replace(pathToReplace, '');

    if (components[actualPath]) {
      return components[actualPath];
    }
  }

  return undefined;
}
