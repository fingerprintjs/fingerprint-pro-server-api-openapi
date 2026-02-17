// @ts-check

/**
 * Represents an inline enum found during schema traversal.
 * @typedef {object} InlineEnum
 * @property {Record<string, unknown>} node - The inline enum schema object
 * @property {Record<string, unknown> | unknown[] | null} parent - Parent object or array containing the enum
 * @property {string | number | null} key - Key under which the enum exists in parent
 * @property {(string | number)[]} path - Path segments to reach this node from root
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
 * Returns operationId prefix when an enum is under a concrete path operation.
 * @param {object} apiDefinition
 * @param {(string | number)[]} path
 * @returns {string | null}
 */
function getOperationPrefix(apiDefinition, path) {
  // Check if this enum is under a path operation
  if (path[0] !== 'paths' || path.length < 3) {
    return null;
  }

  const pathKey = String(path[1]); // e.g., '/v4/events'
  const method = String(path[2]).toLowerCase(); // e.g., 'get'

  const operation = apiDefinition.paths?.[pathKey]?.[method];
  if (!operation || typeof operation !== 'object') {
    return null;
  }

  return toPascalCase(String(operation.operationId));
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
 * @param {(string | number)[]} path
 * @returns {boolean}
 */
function isTopLevelSchema(path) {
  return path.length === 3 && path[0] === 'components' && path[1] === 'schemas' && typeof path[2] === 'string';
}

/**
 * Recursively finds all inline enum schemas in the API definition.
 * @param {unknown} node - Current node being traversed
 * @param {Record<string, unknown> | unknown[] | null} parent - Parent object or array
 * @param {string | number | null} key - Key of node in parent
 * @param {(string | number)[]} path - Path segments to current node
 * @returns {InlineEnum[]}
 */
function findInlineEnums(node, parent, key, path) {
  if (!node || typeof node !== 'object') {
    return [];
  }

  if (Array.isArray(node)) {
    return node.flatMap((item, index) => findInlineEnums(item, node, index, [...path, index]));
  }

  // At this point, node is a non-null, non-array object
  const objectNode = /** @type {Record<string, unknown>} */ (node);

  if (isInlineEnumSchema(objectNode) && !isTopLevelSchema(path)) {
    return [{ node: objectNode, parent, key, path }];
  }

  return Object.keys(objectNode).flatMap((childKey) =>
    findInlineEnums(objectNode[childKey], objectNode, childKey, [...path, childKey])
  );
}

/**
 * Extracts inline enum schemas into reusable components.
 * @param {object} apiDefinition
 */
export function extractInlineEnumsTransformer(apiDefinition) {
  const inlineEnums = findInlineEnums(apiDefinition, null, null, []);

  if (inlineEnums.length === 0) {
    return;
  }

  if (!apiDefinition.components) {
    apiDefinition.components = {};
  }

  if (!apiDefinition.components.schemas) {
    apiDefinition.components.schemas = {};
  }

  const components = apiDefinition.components.schemas;

  for (const inlineEnum of inlineEnums) {
    const schema = structuredClone(inlineEnum.node);
    const parent = inlineEnum.parent && !Array.isArray(inlineEnum.parent) ? inlineEnum.parent : null;
    const baseName = getComponentBaseName(inlineEnum);
    const operationPrefix = getOperationPrefix(apiDefinition, inlineEnum.path);

    // Inherit description from parent if not already set
    if (parent?.description && !schema.description) {
      schema.description = parent.description;
    }

    const componentName = operationPrefix ? `${operationPrefix}${baseName}` : baseName;
    components[componentName] = schema;

    // Replace inline enum with component reference
    if (inlineEnum.parent && inlineEnum.key !== null) {
      inlineEnum.parent[inlineEnum.key] = { $ref: `#/components/schemas/${componentName}` };
    }
  }
}
