// @ts-check
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

function getLastPathValue(path, key) {
  const keyIndex = path.lastIndexOf(key);
  if (keyIndex === -1 || keyIndex + 1 >= path.length) {
    return null;
  }

  const value = path[keyIndex + 1];
  return typeof value === 'string' ? value : null;
}

/**
 * Gets the path context for an enum (operationId or path segment) to disambiguate collisions.
 * @param {object} apiDefinition
 * @param {string[]} path
 * @returns {string | null}
 */
function getPathContext(apiDefinition, path) {
  // Check if this enum is under a path operation
  if (path[0] !== 'paths' || path.length < 3) {
    return null;
  }

  const pathKey = path[1]; // e.g., '/v4/events'
  const method = path[2]; // e.g., 'get'
  const operation = apiDefinition.paths?.[pathKey]?.[method];

  // Prefer operationId if available
  if (operation?.operationId) {
    return toPascalCase(operation.operationId);
  }

  // Fall back to last path segment (e.g., '/v4/events' -> 'Events')
  const lastSegment = pathKey.split('/').filter(Boolean).pop();
  return lastSegment ? toPascalCase(lastSegment) : null;
}

function getComponentBaseName(target) {
  let valueName = null;
  if (target.key === 'schema' && target.parent?.name) {
    valueName = target.parent.name;
  } else {
    valueName = getLastPathValue(target.path, 'properties');

    if (!valueName && typeof target.key === 'string' && target.key !== 'items') {
      valueName = target.key;
    }
  }

  return `${toPascalCase(valueName || 'Inline')}Enum`;
}

/**
 * Gets a unique component name, using path context to disambiguate before falling back to numeric suffix.
 * @param {string} baseName
 * @param {string | null} pathContext
 * @param {Set<string>} usedNames
 * @returns {string}
 */
function getUniqueComponentName(baseName, pathContext, usedNames) {
  const name = baseName || 'InlineEnum';

  // Try simple name first
  if (!usedNames.has(name)) {
    usedNames.add(name);
    return name;
  }

  // Try path-prefixed name on collision (e.g., GetEventsStatusEnum)
  if (pathContext) {
    const pathPrefixedName = `${pathContext}${name}`;
    if (!usedNames.has(pathPrefixedName)) {
      usedNames.add(pathPrefixedName);
      return pathPrefixedName;
    }
  }

  // Fall back to numeric suffix as last resort
  let suffix = 2;
  let suffixedName = `${name}${suffix}`;
  while (usedNames.has(suffixedName)) {
    suffix += 1;
    suffixedName = `${name}${suffix}`;
  }

  usedNames.add(suffixedName);
  return suffixedName;
}

function isTopLevelSchema(path) {
  return path.length === 3 && path[0] === 'components' && path[1] === 'schemas' && typeof path[2] === 'string';
}

function findInlineEnums(node, parent, key, path, targets) {
  if (!node || typeof node !== 'object') {
    return;
  }

  if (Array.isArray(node)) {
    node.forEach((item, index) => {
      findInlineEnums(item, node, index, [...path, index], targets);
    });
    return;
  }

  if (isInlineEnumSchema(node) && !isTopLevelSchema(path)) {
    targets.push({ node, parent, key, path });
    return;
  }

  Object.keys(node).forEach((childKey) => {
    findInlineEnums(node[childKey], node, childKey, [...path, childKey], targets);
  });
}

/**
 * Extracts inline enum schemas into reusable components.
 * @param {object} apiDefinition
 */
export function extractInlineEnumsTransformer(apiDefinition) {
  const targets = [];
  findInlineEnums(apiDefinition, null, null, [], targets);

  if (targets.length === 0) {
    return;
  }

  if (!apiDefinition.components) {
    apiDefinition.components = {};
  }

  if (!apiDefinition.components.schemas) {
    apiDefinition.components.schemas = {};
  }

  const components = apiDefinition.components.schemas;
  const usedComponentNames = new Set(Object.keys(components));
  const bySchemaSignature = new Map();

  targets.forEach((target) => {
    const schema = structuredClone(target.node);

    if (target.parent?.description && !schema.description) {
      schema.description = target.parent.description;
    }

    const signature = JSON.stringify(schema);

    let componentName = bySchemaSignature.get(signature);
    if (!componentName) {
      const baseName = getComponentBaseName(target);
      const pathContext = getPathContext(apiDefinition, target.path);
      componentName = getUniqueComponentName(baseName, pathContext, usedComponentNames);
      components[componentName] = schema;
      bySchemaSignature.set(signature, componentName);
    }

    if (target.parent) {
      target.parent[target.key] = { $ref: `#/components/schemas/${componentName}` };
    }
  });
}
