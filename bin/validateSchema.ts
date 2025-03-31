import Ajv, { ValidateFunction } from 'ajv-draft-04';
import addFormats from 'ajv-formats';
import yaml from 'js-yaml';
import fs from 'fs';
import { convertOpenApiToJsonSchema } from '../utils/convertOpenApiToJsonSchema';
import { generateIdentificationEvent } from '../utils/validateSchema/generateIdentificationEvent';
import {
  FingerprintJsServerApiClient,
  Region,
  RequestError,
  SearchEventsFilter,
} from '@fingerprintjs/fingerprintjs-pro-server-api';
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
  json: any;
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
  relatedVisitorsEnabled: z.coerce.boolean().optional(),
  botDetectionEnabled: z.coerce.boolean().optional(),
});
type TestSubscription = z.infer<typeof testSubscriptionEnvVariableZod> & { requestId: string; visitorId: string };

// Region map for Server API SDK
const REGION_MAP = {
  us: Region.Global,
  eu: Region.EU,
  ap: Region.AP,
} as const;

function getCurrentFunctionName() {
  try {
    throw new Error();
  } catch (e) {
    // Parse the stack trace to get the function name
    const stackLines = e.stack.split('\n');
    // The calling function is typically at index 2 (after Error and getCurrentFunctionName)
    const callerLine = stackLines[2];
    // Extract the function name using regex
    const match = callerLine.match(/at\s+(.*)\s+\(/);
    return match ? `${match[1]}()` : 'anonymous';
  }
}

/**
 * Validate EventResponse schema
 */
async function validateEventResponseSchema(testSubscriptions: TestSubscription[]) {
  const schemaName = 'EventsGetResponse';
  console.log(`\n⚡ ${getCurrentFunctionName()}: Validating ${schemaName} schema: \n`);
  const eventResponseSchema = convertOpenApiToJsonSchema(OPEN_API_SCHEMA, `#/definitions/${schemaName}`);
  const eventValidator = ajv.compile(eventResponseSchema);

  // Validate against example files
  [
    './schemas/paths/examples/get_event_200.json',
    './schemas/paths/examples/get_event_200_all_errors.json',
    './schemas/paths/examples/get_event_200_botd_failed_error.json',
    './schemas/paths/examples/get_event_200_identification_failed_error.json',
    './schemas/paths/examples/get_event_200_too_many_requests_error.json',
  ].forEach((examplePath) =>
    validateJson({
      json: JSON.parse(fs.readFileSync(examplePath).toString()),
      jsonName: examplePath,
      validator: eventValidator,
      schemaName,
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
        schemaName,
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
  const schemaName = 'VisitorsGetResponse';
  console.log(`\n⚡ ${getCurrentFunctionName()}:Validating ${schemaName} schema: \n`);
  const visitsResponseSchema = convertOpenApiToJsonSchema(OPEN_API_SCHEMA, `#/definitions/${schemaName}`);
  const visitsResponseValidator = ajv.compile(visitsResponseSchema);

  // Validate against example files
  [
    './schemas/paths/examples/get_visitors_200_limit_1.json',
    './schemas/paths/examples/get_visitors_200_limit_500.json',
  ].forEach((examplePath) =>
    validateJson({
      json: JSON.parse(fs.readFileSync(examplePath).toString()),
      jsonName: examplePath,
      validator: visitsResponseValidator,
      schemaName,
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
        schemaName: 'VisitorsGetResponse',
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
  const schemaName = 'Webhook';
  console.log(`\n⚡ ${getCurrentFunctionName()}: Validating ${schemaName} schema: \n`);
  const webhookSchema = convertOpenApiToJsonSchema(OPEN_API_SCHEMA, `#/definitions/${schemaName}`);
  const webhookValidator = ajv.compile(webhookSchema);

  // Validate against example file
  ['./schemas/paths/examples/webhook.json'].forEach((examplePath) =>
    validateJson({
      json: JSON.parse(fs.readFileSync(examplePath).toString()),
      jsonName: examplePath,
      validator: webhookValidator,
      schemaName,
    })
  );
}

/**
 * Validates ErrorCommon403Response schema
 */
async function validateCommonError403Schema(testSubscriptions: TestSubscription[]) {
  const schemaName = 'ErrorResponse';
  console.log(`\n⚡ ${getCurrentFunctionName()}: Validating ${schemaName} schema: \n`);
  const commonError403Schema = convertOpenApiToJsonSchema(OPEN_API_SCHEMA, `#/definitions/${schemaName}`);
  const commonError403Validator = ajv.compile(commonError403Schema);

  // Validate against example file
  [
    './schemas/paths/examples/errors/403_feature_not_enabled.json',
    './schemas/paths/examples/errors/403_subscription_not_active.json',
    './schemas/paths/examples/errors/403_token_not_found.json',
    './schemas/paths/examples/errors/403_token_required.json',
    './schemas/paths/examples/errors/403_wrong_region.json',
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
      validateJson({
        json: (error as RequestError).responseBody,
        jsonName: `🌐 Response for GET event '${subscription.name}' > '${subscription.requestId}'`,
        validator: commonError403Validator,
        schemaName,
      });
    }

    try {
      await client.updateEvent({ linkedId: 'OpenAPI spec test' }, subscription.requestId);
      fail(`❌ Updating event ${subscription.requestId} with wrong API key was expected to fail with status 403`);
    } catch (error) {
      validateJson({
        json: (error as RequestError).responseBody,
        jsonName: `🌐 Response for PUT event '${subscription.name}' > '${subscription.requestId}'`,
        validator: commonError403Validator,
        schemaName,
      });
    }

    try {
      const eventResponse = await client.deleteVisitorData(subscription.visitorId);
      fail(`❌ Request for event ${eventResponse} in ${subscription.name} should have failed`);
    } catch (error) {
      validateJson({
        json: (error as RequestError).responseBody,
        jsonName: `🌐 Response for DELETE visitor '${subscription.name}' > '${subscription.visitorId}'`,
        validator: commonError403Validator,
        schemaName,
      });
    }

    // Validate against Related visitors API response
    try {
      const relatedVisitorsResponse = await client.getRelatedVisitors({ visitor_id: subscription.visitorId });
      fail(`❌ Request for related-visitors ${relatedVisitorsResponse} in ${subscription.name} should have failed`);
    } catch (error) {
      validateJson({
        json: (error as RequestError).responseBody,
        jsonName: `🌐 Response for GET related-visitors '${subscription.name}' > '${subscription.visitorId}'`,
        validator: commonError403Validator,
        schemaName,
      });
    }

    // Validate against SearchEvents API response
    try {
      const searchEventsResponse = await client.searchEvents({ limit: 10 });
      fail(`❌ Request for search-events ${searchEventsResponse} in ${subscription.name} should have failed`);
    } catch (error) {
      validateJson({
        json: (error as RequestError).responseBody,
        jsonName: `🌐 Response for GET search-events '${subscription.name}' > '${subscription.visitorId}'`,
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
  const schemaName = 'ErrorResponse';
  console.log(`\n⚡ ${getCurrentFunctionName()}: Validating ${schemaName} schema: \n`);
  const eventError404Schema = convertOpenApiToJsonSchema(OPEN_API_SCHEMA, `#/definitions/${schemaName}`);
  const eventError404Validator = ajv.compile(eventError404Schema);

  // Validate against example file
  ['./schemas/paths/examples/errors/404_request_not_found.json'].forEach((examplePath) =>
    validateJson({
      json: JSON.parse(fs.readFileSync(examplePath).toString()),
      jsonName: examplePath,
      validator: eventError404Validator,
      schemaName,
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
      validateJson({
        json: (error as RequestError).responseBody,
        jsonName: `🌐 Response for GET event '${subscription.name}' > '${nonExistentRequestId}'`,
        validator: eventError404Validator,
        schemaName: 'ErrorResponse',
      });
    }

    try {
      const eventResponse = await client.updateEvent({ linkedId: 'OpenAPI spec test' }, nonExistentRequestId);
      fail(`❌ Updating non-existent requestId was expected to fail with status 404, not with ${eventResponse}`);
    } catch (error) {
      validateJson({
        json: (error as RequestError).responseBody,
        jsonName: `🌐 Response for PUT event '${subscription.name}' > '${nonExistentRequestId}'`,
        validator: eventError404Validator,
        schemaName: 'ErrorResponse',
      });
    }
  }
}

/**
 * Validates VisitsError400 schema
 */
async function validateGetVisitsError400Schema(testSubscriptions: TestSubscription[]) {
  const schemaName = 'ErrorPlainResponse';
  console.log(`\n⚡ ${getCurrentFunctionName()}: Validating ${schemaName} schema: \n`);
  const visitsError400Schema = convertOpenApiToJsonSchema(OPEN_API_SCHEMA, `#/definitions/${schemaName}`);
  const visitsError400Validator = ajv.compile(visitsError400Schema);

  // Validate against example file
  ['./schemas/paths/examples/get_visitors_400_bad_request.json'].forEach((examplePath) =>
    validateJson({
      json: JSON.parse(fs.readFileSync(examplePath).toString()),
      jsonName: examplePath,
      validator: visitsError400Validator,
      schemaName,
    })
  );

  // Validate against live Server API responses
  for (const subscription of testSubscriptions) {
    const client = new FingerprintJsServerApiClient({
      apiKey: subscription.serverApiKey,
      region: REGION_MAP[subscription.region || 'us'],
    });

    try {
      const visitsResponse = await client.getVisits(subscription.visitorId, { request_id: 'Wrong Request ID' });
      fail(`❌ Request for visits ${visitsResponse} in ${subscription.name} should have failed`);
    } catch (error) {
      validateJson({
        json: (error as RequestError).responseBody,
        jsonName: `🌐 Response for GET visitor '${subscription.name}' > '${subscription.visitorId}'`,
        validator: visitsError400Validator,
        schemaName,
      });
    }
  }
}

/**
 * Validates VisitsError403 schema
 */
async function validateGetVisitsError403Schema(testSubscriptions: TestSubscription[]) {
  const schemaName = 'ErrorPlainResponse';
  console.log(`\n⚡ ${getCurrentFunctionName()}: Validating ${schemaName} schema: \n`);
  const visitsError403Schema = convertOpenApiToJsonSchema(OPEN_API_SCHEMA, `#/definitions/${schemaName}`);
  const visitsError403Validator = ajv.compile(visitsError403Schema);

  // Validate against example file
  ['./schemas/paths/examples/get_visitors_403_forbidden.json'].forEach((examplePath) =>
    validateJson({
      json: JSON.parse(fs.readFileSync(examplePath).toString()),
      jsonName: examplePath,
      validator: visitsError403Validator,
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
      const visitsResponse = await client.getVisits(subscription.visitorId);
      fail(`❌ Request for visits ${visitsResponse} in ${subscription.name} should have failed`);
    } catch (error) {
      validateJson({
        json: (error as RequestError).responseBody,
        jsonName: `🌐 Response for GET visitor '${subscription.name}' > '${subscription.visitorId}'`,
        validator: visitsError403Validator,
        schemaName,
      });
    }
  }
}

/**
 * Validates VisitsError429
 */
async function validateGetVisitsError429Schema() {
  const schemaName = 'ErrorPlainResponse';
  console.log(`\n⚡ ${getCurrentFunctionName()}: Validating ${schemaName} schema: \n`);
  const visitsError429Schema = convertOpenApiToJsonSchema(OPEN_API_SCHEMA, `#/definitions/${schemaName}`);
  const visitsError429Validator = ajv.compile(visitsError429Schema);

  // Validate against example file
  ['./schemas/paths/examples/get_visitors_429_too_many_requests.json'].forEach((examplePath) =>
    validateJson({
      json: JSON.parse(fs.readFileSync(examplePath).toString()),
      jsonName: examplePath,
      validator: visitsError429Validator,
      schemaName,
    })
  );
}

/**
 * Validates ErrorCommon429Response
 */
async function validateErrorCommon429Response() {
  const schemaName = 'ErrorResponse';
  console.log(`\n⚡ ${getCurrentFunctionName()}: Validating ${schemaName} schema: \n`);
  const errorCommon429ResponseSchema = convertOpenApiToJsonSchema(OPEN_API_SCHEMA, `#/definitions/${schemaName}`);
  const errorCommon429ResponseValidator = ajv.compile(errorCommon429ResponseSchema);

  // Validate against example file
  ['./schemas/paths/examples/errors/429_too_many_requests.json'].forEach((examplePath) =>
    validateJson({
      json: JSON.parse(fs.readFileSync(examplePath).toString()),
      jsonName: examplePath,
      validator: errorCommon429ResponseValidator,
      schemaName,
    })
  );
}

/**
 * Validates ErrorVisitor400Response schema
 */
async function validateErrorVisitor400Response(testSubscriptions: TestSubscription[]) {
  const schemaName = 'ErrorResponse';
  console.log(`\n⚡ ${getCurrentFunctionName()}: Validating ${schemaName} schema: \n`);
  const visitorError400Schema = convertOpenApiToJsonSchema(OPEN_API_SCHEMA, `#/definitions/${schemaName}`);
  const visitorError400Validator = ajv.compile(visitorError400Schema);

  // Validate against example file
  [
    './schemas/paths/examples/errors/400_request_body_invalid.json',
    './schemas/paths/examples/errors/400_visitor_id_invalid.json',
  ].forEach((examplePath) =>
    validateJson({
      json: JSON.parse(fs.readFileSync(examplePath).toString()),
      jsonName: examplePath,
      validator: visitorError400Validator,
      schemaName,
    })
  );

  // Validate against live Server API responses
  for (const subscription of testSubscriptions) {
    const client = new FingerprintJsServerApiClient({
      apiKey: subscription.serverApiKey,
      region: REGION_MAP[subscription.region || 'us'],
    });

    // Validate against DELETE visitor API response
    try {
      const visitsResponse = await client.deleteVisitorData('malformed visitor id');
      fail(`❌ Request for visits ${visitsResponse} in ${subscription.name} should have failed`);
    } catch (error) {
      validateJson({
        json: (error as RequestError).responseBody,
        jsonName: `🌐 Response for DELETE visitor '${subscription.name}' > '${subscription.visitorId}'`,
        validator: visitorError400Validator,
        schemaName: 'DeleteVisitsError400',
      });
    }

    // Validate against GET related-visitors API response
    try {
      const relatedVisitorsResponse = await client.getRelatedVisitors({ visitor_id: 'badVisitorId' });
      fail(`❌ Request for related-visitors ${relatedVisitorsResponse} in ${subscription.name} should have failed`);
    } catch (error) {
      validateJson({
        json: (error as RequestError).responseBody,
        jsonName: `🌐 Response for GET related-visitors '${subscription.name}' > 'badVisitorId'`,
        validator: visitorError400Validator,
        schemaName,
      });
    }
  }
}

/**
 * Validates ErrorVisitor404Response schema
 */
async function validateErrorVisitor404Response(testSubscriptions: TestSubscription[]) {
  const schemaName = 'ErrorResponse';
  console.log(`\n⚡ ${getCurrentFunctionName()}: Validating ${schemaName} schema: \n`);
  const visitorError404Schema = convertOpenApiToJsonSchema(OPEN_API_SCHEMA, `#/definitions/${schemaName}`);
  const visitorError404Validator = ajv.compile(visitorError404Schema);

  // Validate against example file
  ['./schemas/paths/examples/errors/404_visitor_not_found.json'].forEach((examplePath) =>
    validateJson({
      json: JSON.parse(fs.readFileSync(examplePath).toString()),
      jsonName: examplePath,
      validator: visitorError404Validator,
      schemaName: 'DeleteVisitsError404',
    })
  );

  // Validate against live Server API responses
  for (const subscription of testSubscriptions) {
    const nonExistentVisitor = 'e0srMXYG7PjFCAbE0yIH';

    const client = new FingerprintJsServerApiClient({
      apiKey: subscription.serverApiKey,
      region: REGION_MAP[subscription.region || 'us'],
    });

    const nonExistentVisitorId = 'e1srMXYG7PjFCAbE0yIH';
    try {
      const visitsResponse = await client.deleteVisitorData(nonExistentVisitorId);
      fail(`❌ Request for visits ${visitsResponse} in ${subscription.name} should have failed`);
    } catch (error) {
      validateJson({
        json: (error as RequestError).responseBody,
        jsonName: `🌐 Response for DELETE visitor '${subscription.name}' > '${nonExistentVisitorId}'`,
        validator: visitorError404Validator,
        schemaName,
      });
    }

    try {
      const relatedVisitorsResponse = await client.getRelatedVisitors({ visitor_id: nonExistentVisitor });
      fail(`❌ Request for related-visitors ${relatedVisitorsResponse} in ${subscription.name} should have failed`);
    } catch (error) {
      validateJson({
        json: (error as RequestError).responseBody,
        jsonName: `🌐 Response for GET related-visitors '${subscription.name}' > '${nonExistentVisitor}'`,
        validator: visitorError404Validator,
        schemaName,
      });
    }
  }
}

async function validateRelatedVisitorsResponseSchema(testSubscriptions: TestSubscription[]) {
  const schemaName = 'RelatedVisitorsResponse';
  console.log(`\n⚡ ${getCurrentFunctionName()}: Validating ${schemaName} schema: \n`);
  const relatedVisitorsResponseSchema = convertOpenApiToJsonSchema(OPEN_API_SCHEMA, `#/definitions/${schemaName}`);
  const relatedVisitorsResponseValidator = ajv.compile(relatedVisitorsResponseSchema);

  // Validate against example file
  [
    './schemas/paths/examples/related-visitors/get_related_visitors_200_empty.json',
    './schemas/paths/examples/related-visitors/get_related_visitors_200.json',
  ].forEach((examplePath) =>
    validateJson({
      json: JSON.parse(fs.readFileSync(examplePath).toString()),
      jsonName: examplePath,
      validator: relatedVisitorsResponseValidator,
      schemaName,
    })
  );

  // Validate against live Server API responses
  for (const subscription of testSubscriptions) {
    const client = new FingerprintJsServerApiClient({
      apiKey: subscription.serverApiKey,
      region: REGION_MAP[subscription.region || 'us'],
    });

    const relatedVisitorsResponse = await client.getRelatedVisitors({ visitor_id: subscription.visitorId });
    validateJson({
      json: relatedVisitorsResponse,
      jsonName: `🌐 Response for GET related-visitors '${subscription.name}' > '${subscription.visitorId}'`,
      validator: relatedVisitorsResponseValidator,
      schemaName,
    });
  }
}

/*
 * Validates EventUpdateError400
 */
async function validateUpdateEventError400Schema(testSubscriptions: TestSubscription[]) {
  const schemaName = 'ErrorResponse';
  console.log(`\n⚡ ${getCurrentFunctionName()}: Validating ${schemaName} schema: \n`);
  const updateEvent400ErrorSchema = convertOpenApiToJsonSchema(OPEN_API_SCHEMA, `#/definitions/${schemaName}`);
  const updateEvent400ErrorValidator = ajv.compile(updateEvent400ErrorSchema);

  // Validate against example file
  ['./schemas/paths/examples/errors/400_request_body_invalid.json'].forEach((examplePath) =>
    validateJson({
      json: JSON.parse(fs.readFileSync(examplePath).toString()),
      jsonName: examplePath,
      validator: updateEvent400ErrorValidator,
      schemaName,
    })
  );

  // Validate against live Server API responses
  for (const subscription of testSubscriptions) {
    const client = new FingerprintJsServerApiClient({
      apiKey: subscription.serverApiKey,
      region: REGION_MAP[subscription.region || 'us'],
    });

    try {
      // @ts-expect-error
      const updateEventResponse = await client.updateEvent({ invalid: 'payload' }, subscription.requestId);
      fail(
        `❌ Updating event ${subscription.requestId} in ${subscription.name} should have failed, not succeed with ${updateEventResponse}`
      );
    } catch (error) {
      validateJson({
        json: (error as RequestError).responseBody,
        jsonName: `🌐 Live Server API Response for PUT event '${subscription.name}' > '${subscription.requestId}'`,
        validator: updateEvent400ErrorValidator,
        schemaName,
      });
    }
  }
}

/**
 * Validates EventUpdateError409
 */
async function validateUpdateEventError409Schema(testSubscriptions: TestSubscription[]) {
  const schemaName = 'ErrorResponse';
  console.log(`\n⚡ ${getCurrentFunctionName()}: Validating ${schemaName} schema: \n`);
  const updateEvent409ErrorSchema = convertOpenApiToJsonSchema(OPEN_API_SCHEMA, `#/definitions/${schemaName}`);
  const updateEvent409ErrorValidator = ajv.compile(updateEvent409ErrorSchema);

  // Validate against example file
  ['./schemas/paths/examples/errors/409_state_not_ready.json'].forEach((examplePath) =>
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

    const client = new FingerprintJsServerApiClient({
      apiKey: subscription.serverApiKey,
      region: REGION_MAP[subscription.region || 'us'],
    });

    try {
      const updateEventResponse = await client.updateEvent({ linkedId: '409test' }, requestId);
      fail(
        `❌ Updating event ${subscription.requestId} in ${subscription.name} was expected to fail with status 409, not succeed with ${updateEventResponse}`
      );
    } catch (error) {
      validateJson({
        json: (error as RequestError).responseBody,
        jsonName: `🌐 Live Server API Response for PUT event '${subscription.name}' > '${requestId}'`,
        validator: updateEvent409ErrorValidator,
        schemaName,
      });
    }
  }
}

async function validateSearchEventsResponseSchema(testSubscriptions: TestSubscription[]) {
  const schemaName = 'SearchEventsResponse';
  console.log(`\n⚡ ${getCurrentFunctionName()}: Validating ${schemaName} schema: \n`);
  const searchEventsResponseSchema = convertOpenApiToJsonSchema(OPEN_API_SCHEMA, `#/definitions/${schemaName}`);
  const searchEventsResponseValidator = ajv.compile(searchEventsResponseSchema);

  // Validate against example file
  ['./schemas/paths/examples/get_event_search_200.json'].forEach((examplePath) =>
    validateJson({
      json: JSON.parse(fs.readFileSync(examplePath).toString()),
      jsonName: examplePath,
      validator: searchEventsResponseValidator,
      schemaName,
    })
  );

  // Validate against live Server API responses
  for (const subscription of testSubscriptions) {
    const client = new FingerprintJsServerApiClient({
      apiKey: subscription.serverApiKey,
      region: REGION_MAP[subscription.region || 'us'],
    });

    const filters = [
      { limit: 10 },
      { limit: 10, bot: 'bad' },
      { limit: 10, ip_address: '127.0.0.1/32' },
      { limit: 10, end: new Date().getTime() },
      { limit: 10, start: new Date().getTime() },
      { limit: 10, linked_id: '123' },

      { limit: 10, visitor_id: subscription.visitorId },
      { limit: 10, reverse: true },
      { limit: 10, suspect: true },
      { limit: 10, pagination_key: '123' },
    ] satisfies SearchEventsFilter[];

    for (const filter of filters) {
      const searchEventsResponse = await client.searchEvents(filter);
      validateJson({
        json: searchEventsResponse,
        jsonName: `🌐 Live Server API Response for GET search-events with filter '${JSON.stringify(filter)}'`,
        validator: searchEventsResponseValidator,
        schemaName,
      });
    }
  }
}

async function validateSearchEventsError400Schema(testSubscriptions: TestSubscription[]) {
  const schemaName = 'ErrorResponse';
  console.log(`\n⚡ ${getCurrentFunctionName()}: Validating ${schemaName} schema: \n`);
  const searchEventsError400Schema = convertOpenApiToJsonSchema(OPEN_API_SCHEMA, `#/definitions/${schemaName}`);
  const searchEventsError400Validator = ajv.compile(searchEventsError400Schema);

  // Validate against example file
  [
    './schemas/paths/examples/errors/400_limit_invalid.json',
    './schemas/paths/examples/errors/400_ip_address_invalid.json',
    './schemas/paths/examples/errors/400_bot_type_invalid.json',
    './schemas/paths/examples/errors/400_reverse_invalid.json',
    './schemas/paths/examples/errors/400_start_time_invalid.json',
    './schemas/paths/examples/errors/400_end_time_invalid.json',
    './schemas/paths/examples/errors/400_visitor_id_invalid.json',
    './schemas/paths/examples/errors/400_linked_id_invalid.json',
    './schemas/paths/examples/errors/400_pagination_key_invalid.json',
  ].forEach((examplePath) =>
    validateJson({
      json: JSON.parse(fs.readFileSync(examplePath).toString()),
      jsonName: examplePath,
      validator: searchEventsError400Validator,
      schemaName,
    })
  );

  // Validate against live Server API responses
  for (const subscription of testSubscriptions) {
    const client = new FingerprintJsServerApiClient({
      apiKey: subscription.serverApiKey,
      region: REGION_MAP[subscription.region || 'us'],
    });

    const filters = [
      { limit: 'invalid limit' },
      { limit: 1, ip_address: 'not an ip address' },
      { limit: 1, end: 'not a timestamp' },
      { limit: 1, start: 'not a timestamp' },
      { limit: 1, linked_id: 'C'.repeat(257) },
      { limit: 1, visitor_id: 'not a visitor id' },
      { limit: 1, reverse: 'not a boolean' },
      { limit: 1, suspect: 'not a boolean' },
      { limit: 1, pagination_key: false },
      subscription.botDetectionEnabled && { limit: 1, bot: 'invalid bot value' },
    ];

    for (const filter of filters.filter(Boolean)) {
      try {
        // @ts-expect-error
        const searchEventsResponse = await client.searchEvents(filter);
        fail(
          `❌ Request for search-events with filter '${JSON.stringify(filter)}' should have failed, but returned ${JSON.stringify(searchEventsResponse, null, 2)} in ${subscription.name}`
        );
      } catch (error) {
        validateJson({
          json: (error as RequestError).responseBody,
          jsonName: `🌐 Live Server API Response for GET search-events with filter '${JSON.stringify(filter)}' in ${subscription.name}`,
          validator: searchEventsError400Validator,
          schemaName,
        });
      }
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
  await validateSearchEventsResponseSchema(testSubscriptions);
  await validateRelatedVisitorsResponseSchema(testSubscriptions.filter((sub) => sub.relatedVisitorsEnabled));

  await validateCommonError403Schema(testSubscriptions);
  await validateEventError404Schema(testSubscriptions);
  await validateGetVisitsError400Schema(testSubscriptions);
  await validateGetVisitsError403Schema(testSubscriptions);
  await validateGetVisitsError429Schema();
  await validateErrorVisitor400Response(testSubscriptions);
  await validateErrorCommon429Response();
  await validateErrorVisitor404Response(
    testSubscriptions.filter((sub) => sub.deleteEnabled && sub.relatedVisitorsEnabled)
  );

  await validateUpdateEventError400Schema(testSubscriptions);
  await validateUpdateEventError409Schema(testSubscriptions.slice(1, 2));

  await validateSearchEventsError400Schema(testSubscriptions);

  if (exitCode === 0) {
    console.log('\n ✅✅✅ All schemas are valid');
  } else {
    console.error('\n ❌❌❌ Some schema checks failed, see errors above.');
  }

  process.exit(exitCode);
})();
