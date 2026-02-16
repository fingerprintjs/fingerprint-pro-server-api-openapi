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

  // Limitation: this uses only the local field/parameter name, so unrelated enums may collide.
  return `${toPascalCase(valueName || 'Inline')}Enum`;
}

function getUniqueComponentName(baseName, usedNames) {
  let suffix = 2;
  let name = baseName || 'InlineEnum';

  if (!name) {
    name = 'InlineEnum';
  }

  while (usedNames.has(name)) {
    name = `${baseName}${suffix}`;
    suffix += 1;
  }

  usedNames.add(name);
  return name;
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
      componentName = getUniqueComponentName(baseName, usedComponentNames);
      components[componentName] = schema;
      bySchemaSignature.set(signature, componentName);
    }

    if (target.parent) {
      target.parent[target.key] = { $ref: `#/components/schemas/${componentName}` };
    }
  });
}
