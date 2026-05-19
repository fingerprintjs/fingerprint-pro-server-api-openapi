import { parseYaml } from './parseYaml.js';
import { transformSchema } from './transformSchema.js';
import { removeEdgeTransformer } from './removeEdgeTransformer.js';

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
