import { replaceAllOf } from './replaceAllOf.js';

describe('Test replaceAllOf', () => {
  it('base test', () => {
    const schema = {
      allOf: [
        {
          type: 'object',
          properties: {
            visitorId: {
              type: 'string',
            },
            clientReferrer: {
              type: 'string',
            },
          },
          required: ['visitorId'],
        },
        {
          $ref: '#/definitions/Visit',
        },
      ],
    };

    replaceAllOf(schema, {
      Visit: {
        type: 'object',
        additionalProperties: false,
        properties: {
          requestId: {
            type: 'string',
          },
          browserDetails: {
            $ref: '#/definitions/BrowserDetails',
          },
          incognito: {
            type: 'boolean',
          },
          ip: {
            type: 'string',
            format: 'ipv4',
          },
          ipLocation: {
            $ref: '#/definitions/IPLocation',
          },
        },
        required: ['browserDetails', 'ip', 'ipLocation'],
      },
    });

    expect(schema).toEqual({
      type: 'object',
      additionalProperties: false,
      properties: {
        visitorId: {
          type: 'string',
        },
        clientReferrer: {
          type: 'string',
        },
        requestId: {
          type: 'string',
        },
        browserDetails: {
          $ref: '#/definitions/BrowserDetails',
        },
        incognito: {
          type: 'boolean',
        },
        ip: {
          type: 'string',
          format: 'ipv4',
        },
        ipLocation: {
          $ref: '#/definitions/IPLocation',
        },
      },
      required: ['visitorId', 'browserDetails', 'ip', 'ipLocation'],
    });
  });
});
