import fs from 'fs'
import { transformSchema } from './transformSchema.js'
import { removeBigExamplesTransformer } from './removeBigExamplesTransformer.js'

const simpleYaml = fs.readFileSync('./utils/mocks/simple.yaml')
const schemaWithExamples = fs.readFileSync('./utils/mocks/schemaWithExamples.yaml')
const schemaWithExamplesCleaned = fs.readFileSync('./utils/mocks/schemaWithExamplesCleaned.yaml')

const cleanSchema = (yaml) => transformSchema(yaml, [removeBigExamplesTransformer])
describe('Test removeBigExamplesTransformer', () => {
  it('don`t need to do anything', () => {
    const result = cleanSchema(simpleYaml)
    expect(result.toString()).toEqual(simpleYaml.toString())
  })

  it('need to remove big examples', () => {
    const result = cleanSchema(schemaWithExamples)
    expect(result.toString()).toEqual(schemaWithExamplesCleaned.toString())
  })
})
