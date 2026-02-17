import { compareYamlObjects } from './compareSchemas.js';

describe('compareYamlObjects', () => {
  it('returns added, removed and modified paths for nested objects and arrays', () => {
    const remoteSchema = {
      stable: true,
      removedKey: 123,
      nested: {
        unchanged: 'x',
        changed: 'old',
      },
      array: [1, 2],
    };

    const localSchema = {
      stable: true,
      nested: {
        unchanged: 'x',
        changed: 'new',
        added: true,
      },
      array: [1, 9, 10],
      newKey: 'created',
    };

    const result = compareYamlObjects(remoteSchema, localSchema);

    expect(result).toEqual({
      addedElements: ['/array/2', '/nested/added', '/newKey'],
      removedElements: ['/removedKey'],
      modifiedElements: ['/array/1', '/nested/changed'],
      addedCount: 3,
      removedCount: 1,
      modifiedCount: 2,
    });
  });

  it('treats type changes as modified at the changed path', () => {
    const remoteSchema = {
      payload: {
        id: 'abc',
      },
    };

    const localSchema = {
      payload: ['abc'],
    };

    const result = compareYamlObjects(remoteSchema, localSchema);
    expect(result.modifiedElements).toEqual(['/payload']);
    expect(result.modifiedCount).toBe(1);
    expect(result.addedCount).toBe(0);
    expect(result.removedCount).toBe(0);
  });
});
