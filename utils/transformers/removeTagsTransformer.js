import { walkJson } from '../walkJson.js';

// Removes all tags to prevent Readme API explorer from grouping endpoints by tags unnecessarily
export function removeTagsTransformer(apiDefinition) {
  walkJson(apiDefinition, 'tags', (json) => {
    delete json.tags;
  });
}
