import Ajv, { ValidateFunction } from 'ajv-draft-04';
import addFormats from 'ajv-formats';
import yaml from 'js-yaml';
import fs from 'fs';
import { convertOpenApiToJsonSchema } from '../utils/convertOpenApiToJsonSchema';

/**
 * Set up AJV (validation library)
 */
const ajv = new Ajv({
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

// Load API definition
const OPEN_API_SCHEMA = yaml.load(fs.readFileSync('./dist/schemas/fingerprint-server-api.yaml'));

// Validation Helper
type ValidateJSONArgs = {
  json: Record<string, any>;
  validator: ValidateFunction;
  jsonName: string;
  schemaName: string;
};

const validateJson = ({ json, validator, jsonName, schemaName }: ValidateJSONArgs) => {
  const valid = validator(json);
  if (valid) {
    console.log(`${jsonName} matches ${schemaName} schema ✅`);
  } else {
    console.error(`${jsonName} does not match ${schemaName} schema ❌`);
    console.error(validator.errors);
  }
};

function validateEventResponseSchema() {
  console.log('\nValidating EventResponse schema: \n');
  const eventResponseSchema = convertOpenApiToJsonSchema(OPEN_API_SCHEMA, '#/definitions/EventResponse');
  const eventValidator = ajv.compile(eventResponseSchema);
  [
    './examples/get_event.json',
    './examples/get_event_all_errors.json',
    './examples/get_event_botd_failed_error.json',
    './examples/get_event_botd_too_many_requests_error.json',
    './examples/get_event_identification_failed_error.json',
    './examples/get_event_identification_too_many_requests_error.json',
  ].forEach((examplePath) =>
    validateJson({
      json: JSON.parse(fs.readFileSync(examplePath).toString()),
      jsonName: examplePath,
      validator: eventValidator,
      schemaName: 'EventResponse',
    })
  );
}

validateEventResponseSchema();
