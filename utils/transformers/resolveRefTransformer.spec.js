import fs from 'fs';
import { resolveRefTransformer } from './resolveRefTransformer.js';
import { transformSchema } from './transformSchema.js';

const simpleYaml = fs.readFileSync('./utils/mocks/simple.yaml');
const schemaWithExternalRef = fs.readFileSync('./utils/mocks/schemaWithExternalRef.yaml');
const schemaWithExternalRefResolved = fs.readFileSync('./utils/mocks/schemaWithExternalRefBundled.yaml');
const schemaWithDiscriminator = fs.readFileSync('./utils/mocks/schemaWithDiscriminator.yaml');
const schemaWithDiscriminatorResolved = fs.readFileSync('./utils/mocks/schemaWithDiscriminatorBundled.yaml');

const resolveRef = (yaml, schemaPath) => transformSchema(yaml, [resolveRefTransformer({ schemaPath })]);

const mocksPath = './utils/mocks';
describe('Test resolveRefTransformer', () => {
  it('don`t need to do anything', () => {
    const result = resolveRef(simpleYaml, mocksPath);
    expect(result.toString()).toEqual(simpleYaml.toString());
  });

  it('need to inject one dependency', () => {
    const result = resolveRef(schemaWithExternalRef, mocksPath);
    expect(result.toString()).toEqual(schemaWithExternalRefResolved.toString());
  });

  it('updates a discriminator reference', () => {
    const result = resolveRef(schemaWithDiscriminator, mocksPath);
    expect(result.toString()).toEqual(schemaWithDiscriminatorResolved.toString());
  });
});

describe('Test on real schema', () => {
  it('fingerprint-server-api', () => {
    const yaml = fs.readFileSync('./schemas/fingerprint-server-api-for-sdks.yaml');
    const result = resolveRef(yaml, './schemas');
    expect(result).toBeTruthy();
  });

  it('fingerprint-server-api-v4', () => {
    const yaml = fs.readFileSync('./schemas/fingerprint-server-api-v4.yaml');
    const result = resolveRef(yaml, './schemas');
    expect(result).toBeTruthy();
  });
});
