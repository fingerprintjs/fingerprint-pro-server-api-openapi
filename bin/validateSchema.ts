import Ajv, { ValidateFunction } from 'ajv-draft-04';
import addFormats from 'ajv-formats';
import yaml from 'js-yaml';
import fs from 'fs';
import { convertOpenApiToJsonSchema } from '../utils/convertOpenApiToJsonSchema';
import { generateIdentificationEvent } from '../test/generateIdentificationEvent';
import { FingerprintJsServerApiClient, Region } from '@fingerprintjs/fingerprintjs-pro-server-api';
import { z } from 'zod';
// import { parseEnv } from 'znv';
import 'dotenv/config';

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
const validateJson = ({
  json,
  validator,
  jsonName,
  schemaName,
}: {
  json: Record<string, any>;
  validator: ValidateFunction;
  jsonName: string;
  schemaName: string;
}) => {
  const valid = validator(json);
  if (valid) {
    console.log(`✅ ${schemaName} schema matches ${jsonName}`);
  } else {
    console.error(`❌ ${schemaName} schema does not match ${jsonName} schema `);
    console.error(validator.errors);
    exitCode = 1;
  }
};

// Zod helper for parsing environment variables
const testSubscriptionEnvVariableZod = z.object({
  name: z.string(),
  publicApiKey: z.string(),
  serverApiKey: z.string(),
  region: z.union([z.literal('us'), z.literal('eu'), z.literal('ap')]),
});
type TestSubscription = z.infer<typeof testSubscriptionEnvVariableZod> & { requestId: string; visitorId: string };

// Region map for Server API SDK
const REGION_MAP = {
  us: Region.Global,
  eu: Region.EU,
  ap: Region.AP,
} as const;

async function validateEventResponseSchema(testSubscriptions: TestSubscription[] = []) {
  console.log('\nValidating EventResponse schema: \n');
  const eventResponseSchema = convertOpenApiToJsonSchema(OPEN_API_SCHEMA, '#/definitions/EventResponse');
  const eventValidator = ajv.compile(eventResponseSchema);

  // Validate against example files
  [
    './examples/get_event_200.json',
    './examples/get_event_200_all_errors.json',
    './examples/get_event_200_botd_failed_error.json',
    './examples/get_event_200_botd_too_many_requests_error.json',
    './examples/get_event_200_identification_failed_error.json',
    './examples/get_event_200_identification_too_many_requests_error.json',
  ].forEach((examplePath) =>
    validateJson({
      json: JSON.parse(fs.readFileSync(examplePath).toString()),
      jsonName: examplePath,
      validator: eventValidator,
      schemaName: 'EventResponse',
    })
  );

  // Validate against live Server API responses
  for (const subscription of testSubscriptions) {
    const client = new FingerprintJsServerApiClient({
      apiKey: subscription.serverApiKey,
      region: REGION_MAP[subscription.region || 'us'],
    });

    try {
      const eventResponse = await client.getEvent(subscription.requestId);
      validateJson({
        json: eventResponse,
        jsonName: `🌐 Live Server API EventResponse for '${subscription.name}' > '${subscription.requestId}'`,
        validator: eventValidator,
        schemaName: 'EventResponse',
      });
    } catch (error) {
      console.error(error);
    }
  }
}

export async function validateVisitsResponseSchema(testSubscriptions: TestSubscription[] = []) {
  console.log('\nValidating Visits schema: \n');
  const visitsResponseSchema = convertOpenApiToJsonSchema(OPEN_API_SCHEMA, '#/definitions/Response');
  const visitsResponseValidator = ajv.compile(visitsResponseSchema);

  // Validate against example files
  ['./examples/get_visits_200_limit_1.json', './examples/get_visits_200_limit_500.json'].forEach((examplePath) =>
    validateJson({
      json: JSON.parse(fs.readFileSync(examplePath).toString()),
      jsonName: examplePath,
      validator: visitsResponseValidator,
      schemaName: 'VisitsResponse',
    })
  );

  // Validate against live Server API responses
  for (const subscription of testSubscriptions) {
    const client = new FingerprintJsServerApiClient({
      apiKey: subscription.serverApiKey,
      region: REGION_MAP[subscription.region || 'us'],
    });

    try {
      const visitsResponse = await client.getVisitorHistory(subscription.visitorId);
      validateJson({
        json: visitsResponse,
        jsonName: `🌐 Live Server API Visits Response for '${subscription.name}' > '${subscription.visitorId}'`,
        validator: visitsResponseValidator,
        schemaName: 'VisitsResponse',
      });
    } catch (error) {
      console.error(error);
    }
  }
}

async function validateWebhookSchema() {
  console.log('\nValidating Webhook schema: \n');
  const webhookSchema = convertOpenApiToJsonSchema(OPEN_API_SCHEMA, '#/definitions/WebhookVisit');
  const webhookValidator = ajv.compile(webhookSchema);

  // Validate against example file
  ['./examples/webhook.json'].forEach((examplePath) =>
    validateJson({
      json: JSON.parse(fs.readFileSync(examplePath).toString()),
      jsonName: examplePath,
      validator: webhookValidator,
      schemaName: 'WebhookSchema',
    })
  );
}

async function validateEventError403Schema() {
  console.log('\nValidating EventError403 schema: \n');
  const eventError403Schema = convertOpenApiToJsonSchema(OPEN_API_SCHEMA, '#/definitions/ErrorEvent403Response');
  const eventError403Validator = ajv.compile(eventError403Schema);

  // Validate against example file
  ['./examples/get_event_403_error.json'].forEach((examplePath) =>
    validateJson({
      json: JSON.parse(fs.readFileSync(examplePath).toString()),
      jsonName: examplePath,
      validator: eventError403Validator,
      schemaName: 'EventError403Schema',
    })
  );
}

async function validateEventError404Schema() {
  console.log('\nValidating EventError404 schema: \n');
  const eventError404Schema = convertOpenApiToJsonSchema(OPEN_API_SCHEMA, '#/definitions/ErrorEvent404Response');
  const eventError404Validator = ajv.compile(eventError404Schema);

  // Validate against example file
  ['./examples/get_event_404_error.json'].forEach((examplePath) =>
    validateJson({
      json: JSON.parse(fs.readFileSync(examplePath).toString()),
      jsonName: examplePath,
      validator: eventError404Validator,
      schemaName: 'EventError404Schema',
    })
  );
}

async function validateVisitsError403Schema() {
  console.log('\nValidating VisitsError403 schema: \n');
  const visitsError403Schema = convertOpenApiToJsonSchema(OPEN_API_SCHEMA, '#/definitions/ErrorVisits403');
  const visitsError403Validator = ajv.compile(visitsError403Schema);

  // Validate against example file
  ['./examples/get_visits_403_error.json'].forEach((examplePath) =>
    validateJson({
      json: JSON.parse(fs.readFileSync(examplePath).toString()),
      jsonName: examplePath,
      validator: visitsError403Validator,
      schemaName: 'VisitsError403Schema',
    })
  );
}

async function validateVisitsError429Schema() {
  console.log('\nValidating VisitsError429 schema: \n');
  const visitsError429Schema = convertOpenApiToJsonSchema(OPEN_API_SCHEMA, '#/definitions/ManyRequestsResponse');
  const visitsError429Validator = ajv.compile(visitsError429Schema);

  // Validate against example file
  ['./examples/get_visits_429_too_many_requests_error.json'].forEach((examplePath) =>
    validateJson({
      json: JSON.parse(fs.readFileSync(examplePath).toString()),
      jsonName: examplePath,
      validator: visitsError429Validator,
      schemaName: 'VisitsError429Schema',
    })
  );
}

let exitCode: number = 0;

(async () => {
  // Parse an array of test subscriptions objects from environment variables
  // const { PRIVATE_KEY, TEST_SUBSCRIPTIONS } = parseEnv(process.env, {
  //   PRIVATE_KEY: z.string(),
  //   TEST_SUBSCRIPTIONS: z.array(testSubscriptionEnvVariableZod),
  // });

  // const TEST_SUBSCRIPTIONS = [{ name: 'test', publicApiKey: 'test', serverApiKey: 'test', region: 'us' }] as const;

  console.log(process.env.PRIVATE_KEY);
  console.log(process.env.TEST_SUBSCRIPTIONS);
  console.log(typeof process.env.TEST_SUBSCRIPTIONS);
  console.log(process.env.TEST_SUBSCRIPTIONS?.length);
  const PRIVATE_KEY = process.env.PRIVATE_KEY as string;
  const TEST_SUBSCRIPTIONS = process.env.TEST_SUBSCRIPTIONS as unknown as TestSubscription[];
  console.log(PRIVATE_KEY);
  console.log(TEST_SUBSCRIPTIONS);
  console.log(Array.isArray(TEST_SUBSCRIPTIONS));

  // Generate and identification event for each subscription and add the fresh requestId and visitorId to the object
  const testSubscriptions: TestSubscription[] = [];
  for (const sub of TEST_SUBSCRIPTIONS) {
    const { requestId, visitorId } = await generateIdentificationEvent(sub.publicApiKey, sub.region, sub.name);
    testSubscriptions.push({ ...sub, requestId, visitorId });
  }

  // Validate all parts of the schema against static examples AND live Server API responses from each test subscription
  await validateEventResponseSchema(testSubscriptions);
  await validateVisitsResponseSchema(testSubscriptions);
  await validateWebhookSchema();
  await validateEventError403Schema();
  await validateEventError404Schema();
  await validateVisitsError403Schema();
  await validateVisitsError429Schema();

  if (exitCode === 0) {
    console.log('\n ✅✅✅All schemas are valid');
  } else {
    console.error('\n ❌❌❌Some schemas are invalid, see errors above.');
  }

  process.exit(exitCode);
})();
