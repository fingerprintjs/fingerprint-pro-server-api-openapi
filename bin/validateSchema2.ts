import Ajv, { ValidateFunction } from 'ajv-draft-04';
import addFormats from 'ajv-formats';
import yaml from 'js-yaml';
import fs from 'fs';
import { convertOpenApiToJsonSchema } from '../utils/convertOpenApiToJsonSchema';
import { generateIdentificationEvent } from '../test/generateIdentificationEvent';
import { FingerprintJsServerApiClient, Region } from '@fingerprintjs/fingerprintjs-pro-server-api';
import { z } from 'zod';
import { parseEnv } from 'znv';
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

async function validateEventResponseSchema(testSubscriptions: TestSubscription[]) {
  console.log('\nValidating EventResponse schema: \n');
  const eventResponseSchema = convertOpenApiToJsonSchema(OPEN_API_SCHEMA, '#/definitions/EventResponse');
  const eventValidator = ajv.compile(eventResponseSchema);

  // Validate against example files
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

  // Validate against live Server responses
  for (const subscription of testSubscriptions) {
    const client = new FingerprintJsServerApiClient({
      apiKey: subscription.serverApiKey,
      region: REGION_MAP[subscription.region || 'us'],
    });

    try {
      const eventResponse = await client.getEvent(subscription.requestId);
      validateJson({
        json: eventResponse,
        jsonName: `Live Server API EventResponse for '${subscription.name}' > '${subscription.requestId}'`,
        validator: eventValidator,
        schemaName: 'EventResponse',
      });
    } catch (error) {
      console.error(error);
    }
  }
}

(async () => {
  // Parse an array of test subscriptions objects from environment variables
  const { TEST_SUBSCRIPTIONS } = parseEnv(process.env, {
    TEST_SUBSCRIPTIONS: z.array(testSubscriptionEnvVariableZod),
  });

  // Generate and identification event for each subscription and add the fresh requestId and visitorId to the object
  const testSubscriptions: TestSubscription[] = [];
  for (const sub of TEST_SUBSCRIPTIONS) {
    const { requestId, visitorId } = await generateIdentificationEvent(sub.publicApiKey, sub.region);
    testSubscriptions.push({ ...sub, requestId, visitorId });
  }

  // Validate all parts of the schema against static examples AND live Server API responses from each test subscription
  await validateEventResponseSchema(testSubscriptions);
})();
