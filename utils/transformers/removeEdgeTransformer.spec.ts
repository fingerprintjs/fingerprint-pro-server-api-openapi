import { parseYaml } from './parseYaml.ts';
import { removeEdgeTransformer } from './removeEdgeTransformer.ts';
import { transformSchema } from './transformSchema.ts';

const yamlWithEdge = `
openapi: 3.1.1
paths:
  /events:
    get: {}
  /edge:
    post: {}
`;

describe('removeEdgeTransformer', () => {
  it('removes /edge from paths', () => {
    const result = transformSchema(yamlWithEdge, [removeEdgeTransformer]);
    const parsed = parseYaml(result);

    expect(parsed.paths['/edge']).toBeUndefined();
    expect(parsed.paths['/events']).toBeDefined();
  });

  it('is a no-op when /edge is absent', () => {
    const yamlWithoutEdge = `
openapi: 3.1.1
paths:
  /events:
    get: {}
`;
    const result = transformSchema(yamlWithoutEdge, [removeEdgeTransformer]);
    const parsed = parseYaml(result);

    expect(parsed.paths['/events']).toBeDefined();
    expect(Object.keys(parsed.paths)).toEqual(['/events']);
  });
});
