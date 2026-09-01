import { parseYaml } from './parseYaml.ts';
import { removeFeedbackTransformer } from './removeFeedbackTransformer.ts';
import { transformSchema } from './transformSchema.ts';

const yamlWithFeedback = `
openapi: 3.1.1
paths:
  /events:
    get: {}
  /events/{event_id}/feedback:
    post: {}
`;

describe('removeFeedbackTransformer', () => {
  it('removes /events/{event_id}/feedback from paths', () => {
    const result = transformSchema(yamlWithFeedback, [removeFeedbackTransformer]);
    const parsed = parseYaml(result);

    expect(parsed.paths['/events/{event_id}/feedback']).toBeUndefined();
    expect(parsed.paths['/events']).toBeDefined();
  });

  it('is a no-op when /events/{event_id}/feedback is absent', () => {
    const yamlWithoutFeedback = `
openapi: 3.1.1
paths:
  /events:
    get: {}
`;
    const result = transformSchema(yamlWithoutFeedback, [removeFeedbackTransformer]);
    const parsed = parseYaml(result);

    expect(parsed.paths['/events']).toBeDefined();
    expect(Object.keys(parsed.paths)).toEqual(['/events']);
  });
});
