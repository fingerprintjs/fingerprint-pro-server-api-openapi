import { convertOpenApiToJsonSchema } from './convertOpenApiToJsonSchema.js'

describe('Test convertOpenApiToJsonSchema', () => {
  it('remove extra fields and add required fields', () => {
    const convertedSchema = convertOpenApiToJsonSchema(
      {
        openapi: '3.0.3',
        info: {
          title: 'Fingerprint server API',
          description: 'some description',
        },
        version: '0.1',
        servers: [],
        security: [],
        components: {
          schemas: {
            OurSchemaRef: {
              type: 'object',
              additionalProperties: false,
              properties: {
                name: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
      '#/definitions/OurSchemaRef'
    )

    expect(convertedSchema).toEqual({
      $ref: '#/definitions/OurSchemaRef',
      $schema: 'http://json-schema.org/draft-04/schema#',
      type: 'object',
      definitions: {
        OurSchemaRef: {
          type: 'object',
          additionalProperties: false,
          properties: {
            name: {
              type: 'string',
            },
          },
        },
      },
    })
  })

  it('remove examples', () => {
    const convertedSchema = convertOpenApiToJsonSchema(
      {
        openapi: '3.0.3',
        info: {
          title: 'Fingerprint server API',
          description: 'some description',
        },
        version: '0.1',
        servers: [],
        security: [],
        components: {
          schemas: {
            OurSchemaRef: {
              $ref: '#/definitions/SomeObject',
            },
            SomeObject: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  example: 'Some name',
                },
                id: {
                  type: 'number',
                  example: 1234,
                },
              },
            },
          },
        },
      },
      '#/definitions/OurSchemaRef'
    )
    expect(convertedSchema).toEqual({
      $ref: '#/definitions/OurSchemaRef',
      $schema: 'http://json-schema.org/draft-04/schema#',
      type: 'object',
      definitions: {
        OurSchemaRef: {
          $ref: '#/definitions/SomeObject',
        },
        SomeObject: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
            id: {
              type: 'number',
            },
          },
        },
      },
    })
  })

  it('unwrap schema', () => {
    const convertedSchema = convertOpenApiToJsonSchema(
      {
        openapi: '3.0.3',
        info: {
          title: 'Fingerprint server API',
          description: 'some description',
        },
        version: '0.1',
        servers: [],
        security: [],
        components: {
          schemas: {
            OurSchemaRef: {
              schema: {
                $ref: '#/components/schemas/SomeObject',
              },
              example: {
                code: 'US',
                name: 'United States',
              },
            },
            SomeObject: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                },
                id: {
                  type: 'number',
                },
              },
            },
          },
        },
      },
      '#/definitions/OurSchemaRef'
    )
    expect(convertedSchema).toEqual({
      $ref: '#/definitions/OurSchemaRef',
      $schema: 'http://json-schema.org/draft-04/schema#',
      type: 'object',
      definitions: {
        OurSchemaRef: {
          $ref: '#/definitions/SomeObject',
        },
        SomeObject: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
            id: {
              type: 'number',
            },
          },
        },
      },
    })
  })
})
