import fs from 'fs';
import { resolveExternalValueTransformer } from './resolveExternalValueTransformer.js';

const simpleYaml = fs.readFileSync('./utils/mocks/simple.yaml');
const oneDependencyYaml = fs.readFileSync('./utils/mocks/oneDependency.yaml');
const oneDependencyResolved = fs.readFileSync('./utils/mocks/oneDependencyResolved.yaml');

const twoDependencyYaml = fs.readFileSync('./utils/mocks/twoDependency.yaml');
const twoDependencyResolved = fs.readFileSync('./utils/mocks/twoDependencyResolved.yaml');

describe('Test resolveExternalValueTransformer', () => {
  it('don`t need to do anything', () => {
    const result = resolveExternalValueTransformer(simpleYaml);
    expect(result.toString()).toEqual(simpleYaml.toString());
  });

  it('need to inject one dependency', () => {
    const result = resolveExternalValueTransformer(oneDependencyYaml);
    expect(result.toString()).toEqual(oneDependencyResolved.toString());
  });

  it('need to inject two dependency', () => {
    const result = resolveExternalValueTransformer(twoDependencyYaml);
    expect(result.toString()).toEqual(twoDependencyResolved.toString());
  });
});

describe('Test on real schema', () => {
  it('fingerprint-server-api', () => {
    const yaml = fs.readFileSync('./schemes/fingerprint-server-api.yaml');
    const result = resolveExternalValueTransformer(yaml);
    expect(result).toBeTruthy();
  });
});
