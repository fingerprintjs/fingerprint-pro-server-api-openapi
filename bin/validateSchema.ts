import Ajv, { ValidateFunction } from 'ajv-draft-04';
import addFormats from 'ajv-formats';
import yaml from 'js-yaml';
import fs from 'fs';
import { convertOpenApiToJsonSchema } from '../utils/convertOpenApiToJsonSchema';
import { generateIdentificationEvent } from '../utils/validateSchema/generateIdentificationEvent';
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

// Global exit code variable and helper
let exitCode: number = 0;
const fail = (message: string) => {
  console.error(message);
  exitCode = 1;
};

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
    fail(`❌ ${schemaName} schema does not match ${jsonName} schema, because:`);
    console.error(validator.errors);
    console.log('Invalid JSON: ', JSON.stringify(json, null, 2));
  }
};

// Zod helper for parsing environment variables
const testSubscriptionEnvVariableZod = z.object({
  name: z.string(),
  publicApiKey: z.string(),
  serverApiKey: z.string(),
  region: z.union([z.literal('us'), z.literal('eu'), z.literal('ap')]),
  // Coerce "true" into true
  deleteEnabled: z.coerce.boolean().optional(),
});
type TestSubscription = z.infer<typeof testSubscriptionEnvVariableZod> & { requestId: string; visitorId: string };

// Region map for Server API SDK
const REGION_MAP = {
  us: Region.Global,
  eu: Region.EU,
  ap: Region.AP,
} as const;

// Update event request is not yet supported in the Node SDK
type UpdateEventArgs = {
  requestId: string;
  subscription: TestSubscription;
  payload: any;
};
function updateEventRequest({ requestId, subscription, payload }: UpdateEventArgs) {
  const regionPrefix = subscription.region === 'us' ? '' : `${subscription.region}.`;
  return fetch(`https://${regionPrefix}api.fpjs.io/events/${requestId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Auth-API-Key': subscription.serverApiKey },
    body: JSON.stringify(payload),
  });
}

/**
 * Validate EventResponse schema
 */
async function validateEventResponseSchema(testSubscriptions: TestSubscription[]) {
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
        jsonName: `🌐 Live Server API EventResponse for GET event '${subscription.name}' > '${subscription.requestId}'`,
        validator: eventValidator,
        schemaName: 'EventResponse',
      });
    } catch (error) {
      console.error(error);
      fail(`❌ Error while validating live Server API EventResponse for ${subscription.name}`);
    }
  }
}

/**
 * Validate Visits schema
 */
export async function validateVisitsResponseSchema(testSubscriptions: TestSubscription[]) {
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
      const visitsResponse = await client.getVisitorHistory(subscription.visitorId, { limit: 3 });
      validateJson({
        json: visitsResponse,
        jsonName: `🌐 Live Server API Visits Response for GET visitor '${subscription.name}' > '${subscription.visitorId}'`,
        validator: visitsResponseValidator,
        schemaName: 'VisitsResponse',
      });
    } catch (error) {
      console.error(error);
      fail(`❌ Error while validating live Server API VisitsResponse for ${subscription.name}`);
    }
  }
}

/**
 * Validates Webhook schema
 */
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

/**
 * Validates ErrorCommon403Response schema
 */
async function validateCommonError403Schema(testSubscriptions: TestSubscription[]) {
  console.log('\nValidating CommonError403 schema: \n');
  const schemaName = 'ErrorCommon403Response';
  const commonError403Schema = convertOpenApiToJsonSchema(OPEN_API_SCHEMA, `#/definitions/${schemaName}`);
  const commonError403Validator = ajv.compile(commonError403Schema);

  // Validate against example file
  [
    './examples/get_event_403_error.json',
    './examples/delete_visits_403_error.json',
    './examples/update_event_403_error.json',
  ].forEach((examplePath) =>
    validateJson({
      json: JSON.parse(fs.readFileSync(examplePath).toString()),
      jsonName: examplePath,
      validator: commonError403Validator,
      schemaName,
    })
  );

  // Validate against live Server API responses
  for (const subscription of testSubscriptions) {
    const client = new FingerprintJsServerApiClient({
      apiKey: 'Wrong Server API Key',
      region: REGION_MAP[subscription.region || 'us'],
    });

    try {
      const eventResponse = await client.getEvent(subscription.requestId);
      fail(`❌ Request for event ${eventResponse} in ${subscription.name} should have failed`);
    } catch (error) {
      // Node SDK adds "status" and "response" to the error response, just get rid of it and validate the rest
      delete error.status;
      delete error.response;
      validateJson({
        json: error,
        jsonName: `🌐 Live Server API Response for GET event '${subscription.name}' > '${subscription.requestId}'`,
        validator: commonError403Validator,
        schemaName,
      });
    }

    try {
      const eventResponse = await updateEventRequest({
        requestId: subscription.requestId,
        subscription: { ...subscription, serverApiKey: 'Wrong Server API Key' },
        payload: { linkedId: 'OpenAPI spec test' },
      });
      if (eventResponse.status !== 403) {
        fail(`❌ Updating event with wrong API key was expected to fail with status 403`);
      } else {
        validateJson({
          json: await eventResponse.json(),
          jsonName: `🌐 Live Server API Response for PUT event '${subscription.name}' > '${subscription.requestId}'`,
          validator: commonError403Validator,
          schemaName,
        });
      }
    } catch (error) {
      fail(`❌ Unexpected error when updating event ${error}`);
    }

    try {
      const eventResponse = await client.deleteVisitorData(subscription.visitorId);
      fail(`❌ Request for event ${eventResponse} in ${subscription.name} should have failed`);
    } catch (error) {
      // Node SDK adds "status" and "response" to the error response, just get rid of it and validate the rest
      delete error.status;
      delete error.response;
      validateJson({
        json: error,
        jsonName: `🌐 Live Server API Response for DELETE visitor '${subscription.name}' > '${subscription.visitorId}'`,
        validator: commonError403Validator,
        schemaName,
      });
    }
  }
}

/**
 * Validate EventError404 schema
 */
async function validateEventError404Schema(testSubscriptions: TestSubscription[]) {
  console.log('\nValidating EventError404 schema: \n');
  const eventError404Schema = convertOpenApiToJsonSchema(OPEN_API_SCHEMA, '#/definitions/ErrorEvent404Response');
  const eventError404Validator = ajv.compile(eventError404Schema);

  // Validate against example file
  ['./examples/get_event_404_error.json', './examples/update_event_404_error.json'].forEach((examplePath) =>
    validateJson({
      json: JSON.parse(fs.readFileSync(examplePath).toString()),
      jsonName: examplePath,
      validator: eventError404Validator,
      schemaName: 'EventError404Schema',
    })
  );

  const nonExistentRequestId = 'non-existent-request-id';

  // Validate against live Server API responses
  for (const subscription of testSubscriptions) {
    const client = new FingerprintJsServerApiClient({
      apiKey: subscription.serverApiKey,
      region: REGION_MAP[subscription.region || 'us'],
    });

    try {
      const eventResponse = await client.getEvent(nonExistentRequestId);
      fail(`❌ Request for event ${eventResponse} in ${subscription.name} should have failed`);
    } catch (error) {
      // Node SDK adds "status" and "response" to the error response, just get rid of it and validate the rest
      delete error.status;
      delete error.response;
      validateJson({
        json: error,
        jsonName: `🌐 Live Server API Response for GET event '${subscription.name}' > '${nonExistentRequestId}'`,
        validator: eventError404Validator,
        schemaName: 'EventError404Schema',
      });
    }

    try {
      const eventResponse = await updateEventRequest({
        requestId: nonExistentRequestId,
        subscription,
        payload: { linkedId: 'OpenAPI spec test' },
      });
      if (eventResponse.status !== 404) {
        fail(`❌ Updating non-existed was expected to fail with status 404`);
      } else {
        validateJson({
          json: await eventResponse.json(),
          jsonName: `🌐 Live Server API Response for PUT event '${subscription.name}' > '${nonExistentRequestId}'`,
          validator: eventError404Validator,
          schemaName: 'EventError404Schema',
        });
      }
    } catch (error) {
      fail(`❌ Unexpected error when updating event ${error}`);
    }
  }
}

/**
 * Validates VisitsError403 schema
 */
async function validateGetVisitsError403Schema(testSubscriptions: TestSubscription[]) {
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

  // Validate against live Server API responses
  for (const subscription of testSubscriptions) {
    const client = new FingerprintJsServerApiClient({
      apiKey: 'Wrong Server API Key',
      region: REGION_MAP[subscription.region || 'us'],
    });

    try {
      const visitsResponse = await client.getVisitorHistory(subscription.visitorId);
      fail(`❌ Request for visits ${visitsResponse} in ${subscription.name} should have failed`);
    } catch (error) {
      // Node SDK adds "status" and "response" to the error response, just get rid of it and validate the rest
      delete error.status;
      delete error.response;
      validateJson({
        json: error,
        jsonName: `🌐 Live Server API Response for GET visitor '${subscription.name}' > '${subscription.visitorId}'`,
        validator: visitsError403Validator,
        schemaName: 'VisitsError403Schema',
      });
    }
  }
}

/**
 * Validates VisitsError429
 */
async function validateGetVisitsError429Schema() {
  console.log('\nValidating VisitsError429 schema: \n');
  const visitsError429Schema = convertOpenApiToJsonSchema(OPEN_API_SCHEMA, '#/definitions/TooManyRequestsResponse');
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

/**
 * Validates ErrorCommon429Response
 */
async function validateDeleteVisitsError429Schema() {
  console.log('\nValidating ErrorCommon429Response schema: \n');
  const errorCommon429ResponseSchema = convertOpenApiToJsonSchema(
    OPEN_API_SCHEMA,
    '#/definitions/ErrorCommon429Response'
  );
  const errorCommon429ResponseValidator = ajv.compile(errorCommon429ResponseSchema);

  // Validate against example file
  ['./examples/delete_visits_429_error.json'].forEach((examplePath) =>
    validateJson({
      json: JSON.parse(fs.readFileSync(examplePath).toString()),
      jsonName: examplePath,
      validator: errorCommon429ResponseValidator,
      schemaName: 'ErrorCommon429Response',
    })
  );
}

/**
 * Validates ErrorVisitsDelete400Response schema
 */
async function validateErrorVisitsDelete400Schema(testSubscriptions: TestSubscription[]) {
  console.log('\nValidating DeleteVisitsError400 schema: \n');
  const deleteVisitsError400Schema = convertOpenApiToJsonSchema(
    OPEN_API_SCHEMA,
    '#/definitions/ErrorVisitsDelete400Response'
  );
  const deleteVisitsError400Validator = ajv.compile(deleteVisitsError400Schema);

  // Validate against example file
  ['./examples/delete_visits_400_error.json'].forEach((examplePath) =>
    validateJson({
      json: JSON.parse(fs.readFileSync(examplePath).toString()),
      jsonName: examplePath,
      validator: deleteVisitsError400Validator,
      schemaName: 'DeleteVisitsError400',
    })
  );

  // Validate against live Server API responses
  for (const subscription of testSubscriptions) {
    const client = new FingerprintJsServerApiClient({
      apiKey: subscription.serverApiKey,
      region: REGION_MAP[subscription.region || 'us'],
    });

    try {
      const visitsResponse = await client.deleteVisitorData('malformed visitor id');
      fail(`❌ Request for visits ${visitsResponse} in ${subscription.name} should have failed`);
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { response, status, ...error } = e.error;
      validateJson({
        json: error,
        jsonName: `🌐 Live Server API Response for DELETE visitor '${subscription.name}' > '${subscription.visitorId}'`,
        validator: deleteVisitsError400Validator,
        schemaName: 'DeleteVisitsError400',
      });
    }
  }
}

/**
 * Validates ErrorVisitsDelete404Response schema
 */
async function validateErrorVisitsDelete404Schema(testSubscriptions: TestSubscription[]) {
  console.log('\nValidating DeleteVisitsError404 schema: \n');
  const deleteVisitsError404Schema = convertOpenApiToJsonSchema(
    OPEN_API_SCHEMA,
    '#/definitions/ErrorVisitsDelete404Response'
  );
  const deleteVisitsError404Validator = ajv.compile(deleteVisitsError404Schema);

  // Validate against example file
  ['./examples/delete_visits_404_error.json'].forEach((examplePath) =>
    validateJson({
      json: JSON.parse(fs.readFileSync(examplePath).toString()),
      jsonName: examplePath,
      validator: deleteVisitsError404Validator,
      schemaName: 'DeleteVisitsError404',
    })
  );

  // Validate against live Server API responses
  for (const subscription of testSubscriptions) {
    const client = new FingerprintJsServerApiClient({
      apiKey: subscription.serverApiKey,
      region: REGION_MAP[subscription.region || 'us'],
    });

    const nonExistentVisitorId = 'e1srMXYG7PjFCAbE0yIH';
    try {
      const visitsResponse = await client.deleteVisitorData(nonExistentVisitorId);
      fail(`❌ Request for visits ${visitsResponse} in ${subscription.name} should have failed`);
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { response, status, ...error } = e;
      validateJson({
        json: error,
        jsonName: `🌐 Live Server API Response for DELETE visitor '${subscription.name}' > '${nonExistentVisitorId}'`,
        validator: deleteVisitsError404Validator,
        schemaName: 'DeleteVisitsError404',
      });
    }
  }
}

/*
 * Validates EventUpdateError400
 */
async function validateUpdateEventError400Schema(testSubscriptions: TestSubscription[]) {
  const schemaName = 'ErrorUpdateEvent400Response';
  console.log(`\nValidating ${schemaName} schema: \n`);
  const updateEvent400ErrorSchema = convertOpenApiToJsonSchema(OPEN_API_SCHEMA, `#/definitions/${schemaName}`);
  const updateEvent400ErrorValidator = ajv.compile(updateEvent400ErrorSchema);

  // Validate against example file
  ['./examples/update_event_400_error.json'].forEach((examplePath) =>
    validateJson({
      json: JSON.parse(fs.readFileSync(examplePath).toString()),
      jsonName: examplePath,
      validator: updateEvent400ErrorValidator,
      schemaName,
    })
  );

  // Validate against live Server API responses
  for (const subscription of testSubscriptions) {
    try {
      const updateEventResponse = await updateEventRequest({
        subscription,
        requestId: subscription.requestId,
        payload: { invalid: 'payload' },
      });
      // TODO on Server API side: fix malformed response
      // Remove console logs once fixed
      console.log(updateEventResponse.status);
      console.log(await updateEventResponse.clone().text());
      if (updateEventResponse.status !== 400) {
        fail(`❌ Updating event ${subscription.requestId} in ${subscription.name} should have failed`);
      } else {
        validateJson({
          json: await updateEventResponse.json(),
          jsonName: `🌐 Live Server API Response for PUT event '${subscription.name}' > '${subscription.requestId}'`,
          validator: updateEvent400ErrorValidator,
          schemaName,
        });
      }
    } catch (e) {
      fail(`❌ Unexpected error while updating an event ${e}`);
    }
  }
}

/**
 * Validates EventUpdateError409
 */
async function validateUpdateEventError409Schema(testSubscriptions: TestSubscription[]) {
  const schemaName = 'ErrorUpdateEvent409Response';
  console.log(`\nValidating ${schemaName} schema: \n`);
  const updateEvent409ErrorSchema = convertOpenApiToJsonSchema(
    OPEN_API_SCHEMA,
    '#/definitions/ErrorUpdateEvent409Response'
  );
  const updateEvent409ErrorValidator = ajv.compile(updateEvent409ErrorSchema);

  // Validate against example file
  ['./examples/update_event_409_error.json'].forEach((examplePath) =>
    validateJson({
      json: JSON.parse(fs.readFileSync(examplePath).toString()),
      jsonName: examplePath,
      validator: updateEvent409ErrorValidator,
      schemaName,
    })
  );

  /**
   * Validate against live Server API responses
   * Must generate fresh event and try updating it immediately to get the 409 Response
   */
  for (const subscription of testSubscriptions) {
    const { requestId } = await generateIdentificationEvent(
      subscription.publicApiKey,
      subscription.region,
      subscription.name
    );

    try {
      const updateEventResponse = await updateEventRequest({
        subscription,
        requestId,
        payload: { linkedId: '409test' },
      });
      if (updateEventResponse.status !== 409) {
        fail(
          `❌ Updating event ${subscription.requestId} in ${subscription.name} was expected to fail with status 409`
        );
      } else {
        validateJson({
          json: await updateEventResponse.json(),
          jsonName: `🌐 Live Server API Response for PUT event '${subscription.name}' > '${requestId}'`,
          validator: updateEvent409ErrorValidator,
          schemaName,
        });
      }
    } catch (e) {
      fail(`❌ Unexpected error while updating an event ${e}`);
    }
  }
}

/**
 * Main function
 */
(async () => {
  // Parse an array of test subscriptions objects from environment variables
  const { TEST_SUBSCRIPTIONS } = parseEnv(process.env, {
    TEST_SUBSCRIPTIONS: z.array(testSubscriptionEnvVariableZod),
  });

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

  await validateCommonError403Schema(testSubscriptions);
  await validateEventError404Schema(testSubscriptions);
  await validateGetVisitsError403Schema(testSubscriptions);
  await validateGetVisitsError429Schema();
  await validateErrorVisitsDelete400Schema(testSubscriptions);
  await validateDeleteVisitsError429Schema();
  await validateErrorVisitsDelete404Schema(testSubscriptions.filter((sub) => sub.deleteEnabled));

  await validateUpdateEventError400Schema(testSubscriptions);
  await validateUpdateEventError409Schema(testSubscriptions.slice(1, 2));

  if (exitCode === 0) {
    console.log('\n ✅✅✅ All schemas are valid');
  } else {
    console.error('\n ❌❌❌ Some schema checks failed, see errors above.');
  }

  process.exit(exitCode);
})();
