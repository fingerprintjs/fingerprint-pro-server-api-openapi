import fs from 'fs'
import { transformSchema } from './transformSchema.js'
import { removeXReadmeTransformer } from './removeXReadmeTransformer.js'

const simpleYaml = fs.readFileSync('./utils/mocks/simple.yaml')
const schemaWithXReadme = fs.readFileSync('./utils/mocks/schemaWithXReadme.yaml')
const schemaWithXReadmeCleaned = fs.readFileSync('./utils/mocks/schemaWithXReadmeCleaned.yaml')

const cleanSchema = (yaml) => transformSchema(yaml, [removeXReadmeTransformer])
describe('Test removeXReadmeTransformer', () => {
  it('don`t need to do anything', () => {
    const result = cleanSchema(simpleYaml)
    expect(result.toString()).toEqual(simpleYaml.toString())
  })

  it('need to remove x-readme', () => {
    const result = cleanSchema(schemaWithXReadme)
    expect(result.toString()).toEqual(schemaWithXReadmeCleaned.toString())
  })
})
