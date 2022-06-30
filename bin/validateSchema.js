import fs from 'fs';
import Ajv from 'ajv-draft-04';
import addFormats from 'ajv-formats';
import yaml from 'js-yaml';
import { convertOpenApiToJsonSchema } from '../utils/convertOpenApiToJsonSchema.js';
import 'dotenv/config';

const apiKey = process.env.PRIVATE_KEY;
const visitorId = process.env.VISITOR_ID;

if (!apiKey) {
  console.error('You should provide PRIVATE_KEY environment variable');
  process.exit(1);
}

if (!visitorId) {
  console.error('You should provide VISITOR_ID environment variable');
  process.exit(1);
}

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

function getJsonSchemaValidator() {
  const apiDefinition = yaml.load(fs.readFileSync('./schemes/fingerprint-server-api.yaml'));
  const schema = convertOpenApiToJsonSchema(apiDefinition, '#/definitions/Response');
  return ajv.compile(schema);
}

function getJsonDataMockObjects() {
  const mocks = [
    {
      name: 'Limit 1',
      path: './examples/visits_limit_1.json',
    },
    {
      name: 'Limit 500',
      path: './examples/visits_limit_500.json',
    },
  ];

  return mocks.map(({ name, path }) => ({
    name: `${name} mock`,
    jsonData: JSON.parse(fs.readFileSync(path).toString()),
  }));
}

async function getRealDataObjects() {
  const requests = [
    {
      name: 'Limit 1',
      params: {
        limit: 1,
      },
    },
    {
      name: 'Limit 1 before 1',
      params: {
        limit: 1,
        before: 1,
      },
    },
    {
      name: 'Limit 10',
      params: {
        limit: 10,
      },
    },
    {
      name: 'Limit 500',
      params: {
        limit: 500,
      },
    },
  ];

  return await Promise.all(
    requests.map(async ({ name, params }) => {
      const searchParams = new URLSearchParams(params);
      const url = new URL(`https://api.fpjs.io/visitors/${visitorId}?${searchParams.toString()}`);
      const headers = new Headers({ 'Auth-API-Key': apiKey });
      const request = new Request(url, { headers });
      let result;
      let json;
      try {
        result = await fetch(request);
        json = await result.json();
      } catch (e) {
        console.error(`try to get data by url: ${url.toString()}.
Got request with status: ${result.status}, ${result.statusText}
Catch next error: ${e}`);
      }
      return { name: `${name} real API`, jsonData: json };
    })
  );
}

const validate = getJsonSchemaValidator();

const jsonDataObjects = [...getJsonDataMockObjects(), ...(await getRealDataObjects())];

let exitCode = 0;
jsonDataObjects.forEach(({ name, jsonData }) => {
  if (!validate(jsonData)) {
    exitCode = 1;
    console.error(`${name}: `, validate.errors);
  }
});
process.exit(exitCode);
