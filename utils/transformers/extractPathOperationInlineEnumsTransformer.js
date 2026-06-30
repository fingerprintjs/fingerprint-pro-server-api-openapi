// @ts-check

/**
 * @typedef {{schemas?: Record<string, unknown>} & Record<string, unknown>} ApiComponents
 * @typedef {{paths?: Record<string, unknown>, components?: ApiComponents} & Record<string, unknown>} ApiDefinition
 */

/**
 * Represents an inline enum found during schema traversal.
 * @typedef {object} InlineEnum
 * @property {Record<string, unknown>} node - The inline enum schema object
 * @property {Record<string, unknown> | unknown[] | null} parent - Parent object or array containing the enum
 * @property {string | number | null} key - Key under which the enum exists in parent
 * @property {string} nearestName - The name property of the nearest ancestor
 */

function toPascalCase(value) {
  return value
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((chunk) => chunk[0].toUpperCase() + chunk.slice(1))
    .join('');
}

function isInlineEnumSchema(schema) {
  return Boolean(schema && typeof schema === 'object' && !schema.$ref && Array.isArray(schema.enum));
}

/**
 * Finds the last occurrence of a key in a path array and returns the value that follows it.
 * getLastPathValue('schema', 'properties', 'status', 'properties'); // returns 'status'
 */
function getLastPathValue(path, key) {
  const keyIndex = path.lastIndexOf(key);
  if (keyIndex === -1 || keyIndex + 1 >= path.length) {
    return null;
  }

  const value = path[keyIndex + 1];
  return typeof value === 'string' ? value : null;
}

/**
 * Returns a stable component prefix for an operation.
 * @param {Record<string, unknown>} operation
 * @param {string} pathKey
 * @param {string} method
 * @returns {string}
 */
function getOperationPrefix(operation, pathKey, method) {
  if (typeof operation.operationId === 'string' && operation.operationId.length > 0) {
    return toPascalCase(operation.operationId);
  }

  return `${toPascalCase(method)}${toPascalCase(pathKey) || 'Path'}`;
}

/**
 * Recursively finds inline enum schemas in an operation node.
 * @param {unknown} node - Current node being traversed
 * @param {Record<string, unknown> | unknown[] | null} parent - Parent object or array
 * @param {string | number | null} key - Key of node in parent
 * @param {(string | number)[]} path - Path segments to current node
 * @param {string | null} nearestName - The name property encountered most recently during the traversal
 * @returns {InlineEnum[]}
 */
function findInlineEnumsInOperation(node, parent, key, path, nearestName) {
  if (!node || typeof node !== 'object') {
    return [];
  }

  if (Array.isArray(node)) {
    return node.flatMap((item, index) => findInlineEnumsInOperation(item, node, index, [...path, index], nearestName));
  }

  const objectNode = /** @type {Record<string, unknown>} */ (node);

  if (isInlineEnumSchema(objectNode)) {
    if (!nearestName) {
      // This means there wasn't a name property in the traversal from the operation to this enum.
      // In this case, try to use the name of the property that defined the enum.
      nearestName = getLastPathValue(path, 'properties');
    }

    if (!nearestName) {
      throw new Error(`Failed to calculate enum name suffix for enum: ${JSON.stringify(objectNode)}`);
    }
    return [{ node: objectNode, parent, key, nearestName }];
  }

  nearestName = typeof objectNode.name === 'string' ? objectNode.name : nearestName;

  return Object.keys(objectNode).flatMap((childKey) =>
    findInlineEnumsInOperation(objectNode[childKey], objectNode, childKey, [...path, childKey], nearestName)
  );
}

/**
 * Extracts inline enums that appear inside path operations into reusable components.
 * @param {ApiDefinition} apiDefinition
 */
export function extractPathOperationInlineEnumsTransformer(apiDefinition) {
  if (!apiDefinition.paths || typeof apiDefinition.paths !== 'object') {
    return;
  }

  if (
    !apiDefinition.components ||
    typeof apiDefinition.components !== 'object' ||
    Array.isArray(apiDefinition.components)
  ) {
    apiDefinition.components = {};
  }

  if (
    !apiDefinition.components.schemas ||
    typeof apiDefinition.components.schemas !== 'object' ||
    Array.isArray(apiDefinition.components.schemas)
  ) {
    apiDefinition.components.schemas = {};
  }

  const components = apiDefinition.components.schemas;
  const paths = /** @type {Record<string, unknown>} */ (apiDefinition.paths);

  for (const [pathKey, pathItemValue] of Object.entries(paths)) {
    if (!pathItemValue || typeof pathItemValue !== 'object' || Array.isArray(pathItemValue)) {
      continue;
    }

    const pathItem = /** @type {Record<string, unknown>} */ (pathItemValue);

    for (const [method, operationValue] of Object.entries(pathItem)) {
      if (!operationValue || typeof operationValue !== 'object' || Array.isArray(operationValue)) {
        continue;
      }

      const operation = /** @type {Record<string, unknown>} */ (operationValue);
      const operationPrefix = getOperationPrefix(operation, pathKey, method.toLowerCase());
      const inlineEnums = findInlineEnumsInOperation(operation, null, null, [], null);

      for (const inlineEnum of inlineEnums) {
        const schema = structuredClone(inlineEnum.node);
        const parent = inlineEnum.parent && !Array.isArray(inlineEnum.parent) ? inlineEnum.parent : null;
        const baseName = inlineEnum.nearestName ? toPascalCase(inlineEnum.nearestName) : 'Inline';
        const componentName = `${operationPrefix}${baseName}`;

        // Inherit description from parent if not already set
        if (typeof parent?.description === 'string' && typeof schema.description !== 'string') {
          schema.description = parent.description;
        }

        if (components[componentName]) {
          throw new Error(
            `Inline enum component collision for "${componentName}" (${method.toUpperCase()} ${pathKey}).`
          );
        }

        components[componentName] = schema;

        // Replace inline enum with component reference
        if (inlineEnum.parent && inlineEnum.key !== null) {
          inlineEnum.parent[inlineEnum.key] = { $ref: `#/components/schemas/${componentName}` };
        }
      }
    }
  }
}
