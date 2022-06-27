import fs from 'fs';
import Ajv from 'ajv-draft-04';
import addFormats from 'ajv-formats';
import yaml from 'js-yaml';
import { convertOpenApiToJsonSchema } from '../utils/convertOpenApiToJsonSchema.js';

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

function getJsonSchema() {
  const apiDefinition = yaml.load(fs.readFileSync('./schemes/fingerprint-server-api.yaml'));
  return convertOpenApiToJsonSchema(apiDefinition, '#/definitions/Response');
}

const schema = getJsonSchema();
fs.writeFileSync('./dist/schemes/fingerprint-server-api.json', JSON.stringify(schema, null, 2));
const validate = ajv.compile(schema);

const jsonDataObjects = [
  JSON.parse(fs.readFileSync('./examples/visits_limit_1.json').toString()),
  JSON.parse(fs.readFileSync('./examples/visits_limit_500.json').toString()),
];

let exitCode = 0;
jsonDataObjects.forEach((jsonData) => {
  if (!validate(jsonData)) {
    exitCode = 1;
    console.log(validate.errors);
  }
});
process.exit(exitCode);
