import yaml from 'js-yaml'
import { resolveExternalValueTransformer } from './resolveExternalValueTransformer.js'
import { resolveAllOfTransformer } from './resolveAllOfTransformer.js'
import { removeWebhookTransformer } from './removeWebhookTransformer.js'
import { replaceTagsTransformer } from './replaceTagsTransformer.js'
import { removeBigExamplesTransformer } from './removeBigExamplesTransformer.js'
import { removeXReadmeTransformer } from './removeXReadmeTransformer.js'

const commonTransformers = [resolveExternalValueTransformer, resolveAllOfTransformer]
const defaultTransformers = [...commonTransformers, replaceTagsTransformer]
export const readmeApiExplorerTransformers = [...commonTransformers, removeWebhookTransformer]

export const removeExtraDocumentationTransformers = [
  ...defaultTransformers,
  removeBigExamplesTransformer,
  removeXReadmeTransformer,
]

export function transformSchema(content, transformers = defaultTransformers) {
  const apiDefinition = yaml.load(content)

  transformers.forEach((transformer) => {
    transformer(apiDefinition)
  })

  return yaml.dump(apiDefinition, {
    noRefs: true,
  })
}
