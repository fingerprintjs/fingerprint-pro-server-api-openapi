import fs from 'fs';
import Ajv from 'ajv-draft-04';
import addFormats from 'ajv-formats';
import yaml from 'js-yaml';
// @ts-ignore
import { convertOpenApiToJsonSchema } from '../../utils/convertOpenApiToJsonSchema';

let ajv: Ajv;
export function initAjv() {
  /**
   * Set up AJV (validation library)
   */
  ajv = new Ajv({
    strict: true,
    strictSchema: 'log',
    allErrors: true,
  });

  addFormats(ajv);
  ajv.addFormat('timezone', {
    type: 'string',
    validate: (data) => typeof data === 'string',
  });
  ajv.addFormat('date-time', {
    type: 'string',
    validate: (data) => typeof data === 'string' && /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(.\d{1,3})?Z/.test(data),
  });

  ajv.addKeyword({
    keyword: 'x-platforms',
    schemaType: 'array',
    metaSchema: {
      type: 'array',
      items: { type: 'string' },
    },
  });

  ajv.addKeyword({
    keyword: 'x-go-force-pointer',
    schemaType: 'boolean',
    valid: true,
  });
}

// Load API definition
const OPEN_API_SCHEMA_V3 = yaml.load(fs.readFileSync('./dist/schemas/fingerprint-server-api.yaml').toString());
const OPEN_API_SCHEMA_V4 = yaml.load(fs.readFileSync('./dist/schemas/fingerprint-server-api-v4.yaml').toString());

export const createValidatorV3 = (schemaName: string, functionName: string) => {
  console.log(`\n⚡ ${functionName}() — validating ${schemaName} schema: \n`);
  const jsonSchema = convertOpenApiToJsonSchema(OPEN_API_SCHEMA_V3, `#/definitions/${schemaName}`);
  return ajv.compile(jsonSchema);
};

export const createValidatorV4 = (schemaName: string, functionName: string) => {
  console.log(`\n⚡ ${functionName}() — validating ${schemaName} schema: \n`);
  const jsonSchema = convertOpenApiToJsonSchema(OPEN_API_SCHEMA_V4, `#/definitions/${schemaName}`);
  return ajv.compile(jsonSchema);
};
