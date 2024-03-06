import fs from 'fs'
import { walkJson } from '../walkJson.js'

export function loadJson(path) {
  return JSON.parse(fs.readFileSync('.' + path))
}

export function resolveExternalValueTransformer(apiDefinition) {
  walkJson(apiDefinition, 'externalValue', (partWithKey) => {
    partWithKey.value = loadJson(partWithKey.externalValue)
    delete partWithKey.externalValue
  })
}
