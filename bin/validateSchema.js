import fs from 'fs';
import Ajv from 'ajv-draft-04';
import addFormats from 'ajv-formats';
import yaml from 'js-yaml';
import { convertOpenApiToJsonSchema } from '../utils/convertOpenApiToJsonSchema.js';
import 'dotenv/config';

function gatherEnvs() {
  const envs = {
    PRIVATE_KEY: process.env.PRIVATE_KEY,
    VISITOR_ID: process.env.VISITOR_ID,
    REQUEST_ID: process.env.REQUEST_ID,
  };

  Object.entries(envs).forEach(([key, value]) => {
    if (!value) {
      throw new Error(`You should provide ${key} env variable`);
    }
  });

  return {
    apiKey: envs.PRIVATE_KEY,
    visitorId: envs.VISITOR_ID,
    requestId: envs.REQUEST_ID,
  };
}

function setupAjv() {
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

  return ajv;
}

let exitCode = 0;

const { apiKey, visitorId, requestId } = gatherEnvs();

const ajv = setupAjv();

async function makeApiRequest(path, name, params = {}) {
  const searchParams = new URLSearchParams(params);
  const url = new URL(`https://api.fpjs.io/${path}?${searchParams.toString()}`);
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
}

function getJsonSchemaValidator() {
  const apiDefinition = yaml.load(fs.readFileSync('./dist/schemes/fingerprint-server-api.yaml'));
  const visitorsApiSchema = convertOpenApiToJsonSchema(apiDefinition, '#/definitions/Response');
  const webhookSchema = convertOpenApiToJsonSchema(apiDefinition, '#/definitions/WebhookVisit');
  const eventsApiSchema = convertOpenApiToJsonSchema(apiDefinition, '#/definitions/EventResponse');
  const errorResponseSchema = convertOpenApiToJsonSchema(apiDefinition, '#/definitions/ErrorResponse');

  return {
    visitorsApiValidator: ajv.compile(visitorsApiSchema),
    webhookValidator: ajv.compile(webhookSchema),
    eventsValidator: ajv.compile(eventsApiSchema),
    errorResponseValidator: ajv.compile(errorResponseSchema),
  };
}

function convertToMockObjects(mocks) {
  return mocks.map(({ name, path }) => ({
    name: `${name} mock`,
    jsonData: JSON.parse(fs.readFileSync(path).toString()),
  }));
}

function getVisitorsApiJsonDataMockObjects() {
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

  return convertToMockObjects(mocks);
}

function getEventsApiJsonDataMockObjects() {
  const mocks = [
    {
      name: 'Events',
      path: './examples/get_event.json',
    },
    {
      name: '400 error',
      path: './examples/get_event_400_error.json',
    },
    {
      name: '403 error',
      path: './examples/get_event_403_error.json',
    },
  ];

  return convertToMockObjects(mocks);
}

function getWebhookJsonDataMockObjects() {
  const mocks = [
    {
      name: 'Webhook',
      path: './examples/webhook.json',
    },
  ];

  return convertToMockObjects(mocks);
}

async function getEventApiRealDataObjects() {
  const response = await makeApiRequest(`events/${requestId}`, 'Event');

  return [response];
}

async function getVisitorsApiRealDataObjects() {
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
      return makeApiRequest(`visitors/${visitorId}`, name, params);
    })
  );
}

function validateSchemaAgainstData(validator, objects) {
  objects.forEach(({ name, jsonData }) => {
    if (!validator(jsonData)) {
      exitCode = 1;
      console.error(`${name}: `, visitorsApiValidator.errors);
    }
  });
}

const { visitorsApiValidator, webhookValidator, eventsValidator, errorResponseValidator } = getJsonSchemaValidator();

const visitorsApiJsonDataObjects = [...getVisitorsApiJsonDataMockObjects(), ...(await getVisitorsApiRealDataObjects())];
const webhookDataObjects = getWebhookJsonDataMockObjects();

const [realEventsData, eventsDataObjects, ...eventErrors] = [
  ...(await getEventApiRealDataObjects()),
  ...getEventsApiJsonDataMockObjects(),
];

validateSchemaAgainstData(visitorsApiValidator, visitorsApiJsonDataObjects);
validateSchemaAgainstData(webhookValidator, webhookDataObjects);
validateSchemaAgainstData(eventsValidator, [eventsDataObjects, realEventsData]);
validateSchemaAgainstData(errorResponseValidator, eventErrors);

process.exit(exitCode);
