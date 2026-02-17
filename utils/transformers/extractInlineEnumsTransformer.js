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
 * @property {(string | number)[]} path - Path segments to reach this node from the operation root
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
 * Gets a base component name for an inline enum based on its location in the schema.
 * Always returns a non-empty string (e.g., 'Status', 'Inline').
 * @param {InlineEnum} target
 * @returns {string} Non-empty component base name
 */
function getComponentBaseName(target) {
  let valueName = null;
  const parent = target.parent && !Array.isArray(target.parent) ? target.parent : null;
  if (target.key === 'schema' && parent?.name) {
    valueName = parent.name;
  } else {
    valueName = getLastPathValue(target.path, 'properties');

    if (!valueName && typeof target.key === 'string' && target.key !== 'items') {
      valueName = target.key;
    }
  }

  return toPascalCase(valueName || 'Inline');
}

/**
 * Recursively finds inline enum schemas in an operation node.
 * @param {unknown} node - Current node being traversed
 * @param {Record<string, unknown> | unknown[] | null} parent - Parent object or array
 * @param {string | number | null} key - Key of node in parent
 * @param {(string | number)[]} path - Path segments to current node
 * @returns {InlineEnum[]}
 */
function findInlineEnumsInOperation(node, parent, key, path) {
  if (!node || typeof node !== 'object') {
    return [];
  }

  if (Array.isArray(node)) {
    return node.flatMap((item, index) => findInlineEnumsInOperation(item, node, index, [...path, index]));
  }

  const objectNode = /** @type {Record<string, unknown>} */ (node);

  if (isInlineEnumSchema(objectNode)) {
    return [{ node: objectNode, parent, key, path }];
  }

  return Object.keys(objectNode).flatMap((childKey) =>
    findInlineEnumsInOperation(objectNode[childKey], objectNode, childKey, [...path, childKey])
  );
}

/**
 * Extracts inline enums that appear inside path operations into reusable components.
 * @param {ApiDefinition} apiDefinition
 */
export function extractInlineEnumsTransformer(apiDefinition) {
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
      const inlineEnums = findInlineEnumsInOperation(operation, null, null, []);

      for (const inlineEnum of inlineEnums) {
        const schema = structuredClone(inlineEnum.node);
        const parent = inlineEnum.parent && !Array.isArray(inlineEnum.parent) ? inlineEnum.parent : null;
        const baseName = getComponentBaseName(inlineEnum);
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
