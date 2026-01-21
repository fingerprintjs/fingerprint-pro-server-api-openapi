import { transformSchema } from './transformSchema.js';
import { removeFieldsByPrefixTransformer } from './removeFieldsByPrefixTransformer.js';

const cleanSchema = (yaml) => transformSchema(yaml, [removeFieldsByPrefixTransformer('x-ruleset-')]);

describe('Test removeFieldsByPrefixTransformer', () => {
  it('does nothing when no matching fields', () => {
    const input = `
openapi: 3.0.0
info:
  title: Test API
components:
  schemas:
    Test:
      type: string
      description: A test field
`;
    const result = cleanSchema(input);
    expect(result).toContain('description: A test field');
  });

  it('removes x-ruleset-metadata field', () => {
    const input = `
openapi: 3.0.0
components:
  schemas:
    Test:
      type: string
      description: A test field
      x-ruleset-metadata:
        label: Test Label
        category: test
`;
    const result = cleanSchema(input);
    expect(result).not.toContain('x-ruleset-metadata');
    expect(result).not.toContain('Test Label');
    expect(result).toContain('description: A test field');
  });

  it('removes x-ruleset-label-prefix field', () => {
    const input = `
openapi: 3.0.0
components:
  schemas:
    Test:
      type: object
      properties:
        nested:
          type: string
          x-ruleset-label-prefix: 'Prefix '
`;
    const result = cleanSchema(input);
    expect(result).not.toContain('x-ruleset-label-prefix');
    expect(result).not.toContain('Prefix');
  });

  it('removes x-ruleset-ignore-ref field', () => {
    const input = `
openapi: 3.0.0
components:
  schemas:
    Test:
      type: object
      properties:
        confidence:
          type: number
          x-ruleset-ignore-ref: true
`;
    const result = cleanSchema(input);
    expect(result).not.toContain('x-ruleset-ignore-ref');
    expect(result).toContain('confidence');
  });

  it('removes multiple x-ruleset-* fields at different nesting levels', () => {
    const input = `
openapi: 3.0.0
components:
  schemas:
    TestSchema:
      type: object
      x-ruleset-metadata:
        label: Parent Label
        category: parent
      properties:
        child:
          type: string
          x-ruleset-metadata:
            label: Child Label
            category: child
          x-ruleset-label-prefix: 'Some Prefix '
`;
    const result = cleanSchema(input);
    expect(result).not.toContain('x-ruleset-metadata');
    expect(result).not.toContain('x-ruleset-label-prefix');
    expect(result).not.toContain('Parent Label');
    expect(result).not.toContain('Child Label');
    expect(result).not.toContain('Some Prefix');
    expect(result).toContain('type: object');
    expect(result).toContain('type: string');
  });

  it('preserves other x-* fields', () => {
    const input = `
openapi: 3.0.0
components:
  schemas:
    Test:
      type: string
      x-platforms:
        - browser
        - android
      x-ruleset-metadata:
        label: Test
`;
    const result = cleanSchema(input);
    expect(result).toContain('x-platforms');
    expect(result).toContain('browser');
    expect(result).not.toContain('x-ruleset-metadata');
  });
});
