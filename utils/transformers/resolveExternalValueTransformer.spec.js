import fs from 'fs'
import { resolveExternalValueTransformer } from './resolveExternalValueTransformer.js'
import { transformSchema } from './transformSchema.js'

const simpleYaml = fs.readFileSync('./utils/mocks/simple.yaml')
const oneDependencyYaml = fs.readFileSync('./utils/mocks/oneDependency.yaml')
const oneDependencyResolved = fs.readFileSync('./utils/mocks/oneDependencyResolved.yaml')

const twoDependencyYaml = fs.readFileSync('./utils/mocks/twoDependency.yaml')
const twoDependencyResolved = fs.readFileSync('./utils/mocks/twoDependencyResolved.yaml')

const resolveExternal = (yaml) => transformSchema(yaml, [resolveExternalValueTransformer])

describe('Test resolveExternalValueTransformer', () => {
  it('don`t need to do anything', () => {
    const result = resolveExternal(simpleYaml)
    expect(result.toString()).toEqual(simpleYaml.toString())
  })

  it('need to inject one dependency', () => {
    const result = resolveExternal(oneDependencyYaml)
    expect(result.toString()).toEqual(oneDependencyResolved.toString())
  })

  it('need to inject two dependency', () => {
    const result = resolveExternal(twoDependencyYaml)
    expect(result.toString()).toEqual(twoDependencyResolved.toString())
  })
})

describe('Test on real schema', () => {
  it('fingerprint-server-api', () => {
    const yaml = fs.readFileSync('./schemas/fingerprint-server-api.yaml')
    const result = resolveExternal(yaml)
    expect(result).toBeTruthy()
  })
})
